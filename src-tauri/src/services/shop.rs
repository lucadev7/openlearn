use std::collections::HashSet;

use rusqlite::{params, Connection};

use crate::error::{AppError, AppResult};
use crate::models::{ShopItemView, ShopView};
use crate::services::settings;
use crate::util::now_epoch;

struct CatalogItem {
    id: &'static str,
    kind: &'static str, // "theme" | "avatar"
    name: &'static str,
    description: &'static str,
    price: i64,
    free: bool,
}

/// The cosmetic catalog. Cosmetics only — no gameplay effect. Themes map to the
/// `data-theme` palettes in the frontend; avatars map to a visual in the UI.
const CATALOG: &[CatalogItem] = &[
    CatalogItem { id: "aurora", kind: "theme", name: "Aurora", description: "Das dunkle Standard-Theme.", price: 0, free: true },
    CatalogItem { id: "paper", kind: "theme", name: "Papier", description: "Helles, ruhiges Theme.", price: 0, free: true },
    CatalogItem { id: "midnight", kind: "theme", name: "Mitternacht", description: "Tiefes Blau-Schwarz, kühler Akzent.", price: 800, free: false },
    CatalogItem { id: "sunset", kind: "theme", name: "Sonnenuntergang", description: "Warme Orange- und Pinktöne.", price: 1000, free: false },
    CatalogItem { id: "forest", kind: "theme", name: "Wald", description: "Sattes Grün, erdig und fokussiert.", price: 1000, free: false },
    CatalogItem { id: "ocean", kind: "theme", name: "Ozean", description: "Türkis und Tiefblau.", price: 1200, free: false },
    CatalogItem { id: "rose", kind: "theme", name: "Rosé", description: "Sanftes Pink, helle Oberfläche.", price: 1200, free: false },
    CatalogItem { id: "mono", kind: "theme", name: "Mono", description: "Reduziertes Graustufen-Theme.", price: 900, free: false },
    CatalogItem { id: "neon", kind: "theme", name: "Neon", description: "Kräftige Akzente auf tiefem Schwarz.", price: 1500, free: false },
    CatalogItem { id: "ol", kind: "avatar", name: "OpenLearn", description: "Das klassische OL-Zeichen.", price: 0, free: true },
    CatalogItem { id: "fox", kind: "avatar", name: "Fuchs", description: "Schlau wie ein Fuchs.", price: 400, free: false },
    CatalogItem { id: "rocket", kind: "avatar", name: "Rakete", description: "Ab durch die Decke.", price: 600, free: false },
    CatalogItem { id: "brain", kind: "avatar", name: "Gehirn", description: "Pures Wissen.", price: 600, free: false },
    CatalogItem { id: "owl", kind: "avatar", name: "Eule", description: "Nachtaktiver Lerner.", price: 800, free: false },
    CatalogItem { id: "lightning", kind: "avatar", name: "Blitz", description: "Schnelle Auffassung.", price: 800, free: false },
    CatalogItem { id: "sakura", kind: "avatar", name: "Sakura", description: "Ruhe und Fokus.", price: 1000, free: false },
    CatalogItem { id: "crown", kind: "avatar", name: "Krone", description: "Für wahre Lern-Profis.", price: 1500, free: false },
];

fn find(id: &str) -> Option<&'static CatalogItem> {
    CATALOG.iter().find(|c| c.id == id)
}

fn owned_set(conn: &Connection) -> AppResult<HashSet<String>> {
    let mut stmt = conn.prepare("SELECT item_id FROM shop_owned")?;
    let rows = stmt.query_map([], |r| r.get::<_, String>(0))?;
    let mut set = HashSet::new();
    for row in rows {
        set.insert(row?);
    }
    Ok(set)
}

fn coins(conn: &Connection) -> AppResult<i64> {
    Ok(conn.query_row("SELECT coins FROM profile WHERE id = 1", [], |r| r.get(0))?)
}

pub fn view(conn: &Connection) -> AppResult<ShopView> {
    let s = settings::get(conn)?;
    let owned = owned_set(conn)?;
    let items = CATALOG
        .iter()
        .map(|c| {
            let is_owned = c.free || owned.contains(c.id);
            let equipped = match c.kind {
                "theme" => s.theme == c.id,
                "avatar" => s.avatar == c.id,
                _ => false,
            };
            ShopItemView {
                id: c.id.to_string(),
                kind: c.kind.to_string(),
                name: c.name.to_string(),
                description: c.description.to_string(),
                price: c.price,
                free: c.free,
                owned: is_owned,
                equipped,
            }
        })
        .collect();
    Ok(ShopView {
        coins: coins(conn)?,
        equipped_theme: s.theme,
        equipped_avatar: s.avatar,
        items,
    })
}

pub fn buy(conn: &mut Connection, item_id: &str) -> AppResult<ShopView> {
    let item = find(item_id).ok_or_else(|| AppError::NotFound(format!("Artikel {item_id}")))?;
    if item.free {
        return Err(AppError::Invalid("Dieser Artikel ist kostenlos.".into()));
    }
    if owned_set(conn)?.contains(item.id) {
        return Err(AppError::Invalid("Du besitzt diesen Artikel bereits.".into()));
    }
    let balance = coins(conn)?;
    if balance < item.price {
        return Err(AppError::Invalid(format!(
            "Nicht genug Coins ({balance}/{}).",
            item.price
        )));
    }
    let tx = conn.transaction()?;
    tx.execute("UPDATE profile SET coins = coins - ?1 WHERE id = 1", params![item.price])?;
    tx.execute(
        "INSERT INTO shop_owned (item_id, acquired_at) VALUES (?1, ?2)",
        params![item.id, now_epoch()],
    )?;
    tx.commit()?;
    view(conn)
}

pub fn equip(conn: &Connection, item_id: &str) -> AppResult<ShopView> {
    let item = find(item_id).ok_or_else(|| AppError::NotFound(format!("Artikel {item_id}")))?;
    if !item.free && !owned_set(conn)?.contains(item.id) {
        return Err(AppError::Invalid("Diesen Artikel hast du noch nicht gekauft.".into()));
    }
    let mut s = settings::get(conn)?;
    match item.kind {
        "theme" => s.theme = item.id.to_string(),
        "avatar" => s.avatar = item.id.to_string(),
        _ => return Err(AppError::Invalid("Unbekannter Artikeltyp.".into())),
    }
    settings::set(conn, &s)?;
    view(conn)
}
