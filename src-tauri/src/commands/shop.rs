use tauri::State;

use crate::error::AppResult;
use crate::models::ShopView;
use crate::services::shop;
use crate::state::AppState;

#[tauri::command]
pub fn shop_list(state: State<AppState>) -> AppResult<ShopView> {
    let conn = state.db.lock().unwrap();
    shop::view(&conn)
}

#[tauri::command]
pub fn shop_buy(state: State<AppState>, item_id: String) -> AppResult<ShopView> {
    let mut conn = state.db.lock().unwrap();
    shop::buy(&mut conn, &item_id)
}

#[tauri::command]
pub fn shop_equip(state: State<AppState>, item_id: String) -> AppResult<ShopView> {
    let conn = state.db.lock().unwrap();
    shop::equip(&conn, &item_id)
}
