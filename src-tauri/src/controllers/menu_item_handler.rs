use sea_orm::{ActiveModelTrait, EntityTrait, ModelTrait, QueryFilter, QueryOrder, QuerySelect, RelationTrait, ColumnTrait};
use entity::menu_item::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct MenuItemHandler;

impl MenuItemHandler {
    // View menu items for a specific restaurant (or all if restaurant_id is None)
    pub async fn view_menu_items(state: &AppState, restaurant_id: Option<String>) -> Result<ApiResponse<Vec<Model>>, String> {
        let mut query = menu_item::Entity::find().order_by_asc(menu_item::Column::Name);

        if let Some(rest_id) = restaurant_id {
            query = query.filter(menu_item::Column::RestaurantId.eq(rest_id));
        }

        match query.all(&state.db).await {
            Ok(menu_items) => Ok(ApiResponse::success(menu_items)),
            Err(err) => Err(format!("Error fetching menu items: {}", err)),
        }
    }


    // Get menu item details by ID
    pub async fn get_menu_item_details(
        state: &AppState,
        menu_item_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match menu_item::Entity::find_by_id(menu_item_id.clone()).one(&state.db).await {
            Ok(Some(menu_item_details)) => {
                Ok(ApiResponse::success(menu_item_details))
            }
            Ok(None) => {
                Err("Menu item not found".to_string())
            }
            Err(err) => {
                Err(format!("Database error fetching menu item details: {}", err))
            }
        }
    }

    // Save menu item data (create new menu item)
    pub async fn save_menu_item_data(
        state: &AppState,
        photo: Option<String>,
        name: String,
        price: String,
        restaurant_id: String, // Required: menu item must belong to a restaurant
    ) -> Result<ApiResponse<String>, String> {
        // Generate a UUID for the menu_item_id
        let menu_item_id = Uuid::new_v4().to_string();

        let new_menu_item = menu_item::ActiveModel {
            menu_item_id: sea_orm::ActiveValue::Set(menu_item_id),
            photo: sea_orm::ActiveValue::Set(photo),
            name: sea_orm::ActiveValue::Set(name),
            price: sea_orm::ActiveValue::Set(price),
            restaurant_id: sea_orm::ActiveValue::Set(restaurant_id), // Set the restaurant_id
            ..Default::default()
        };

        match menu_item::Entity::insert(new_menu_item).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Menu item created successfully".to_string())),
            Err(err) => Err(format!("Error creating menu item: {}", err)),
        }
    }

    // Update menu item data
    pub async fn update_menu_item_data(
        state: &AppState,
        menu_item_id: String,
        photo: Option<Option<String>>, // Option<Option<String>> for optional update and allow setting to NULL
        name: Option<String>,
        price: Option<String>,
        restaurant_id: Option<String>, // Allow changing restaurant_id
    ) -> Result<ApiResponse<String>, String> {
        let menu_item_record = match menu_item::Entity::find_by_id(menu_item_id).one(&state.db).await {
            Ok(Some(menu_item)) => menu_item,
            Ok(None) => return Err("Menu item not found".to_string()),
            Err(err) => return Err(format!("Error fetching menu item: {}", err)),
        };

        let mut active_menu_item: menu_item::ActiveModel = menu_item_record.into();

        if let Some(new_photo) = photo {
            active_menu_item.photo = sea_orm::ActiveValue::Set(new_photo);
        }
        if let Some(new_name) = name {
            active_menu_item.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_price) = price {
            active_menu_item.price = sea_orm::ActiveValue::Set(new_price);
        }
        if let Some(new_restaurant_id) = restaurant_id {
            active_menu_item.restaurant_id = sea_orm::ActiveValue::Set(new_restaurant_id);
        }


        match active_menu_item.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Menu item updated successfully".to_string())),
            Err(err) => Err(format!("Error updating menu item: {}", err)),
        }
    }

    // Delete menu item data
    pub async fn delete_menu_item_data(state: &AppState, menu_item_id: String) -> Result<String, String> {
        match menu_item::Entity::delete_by_id(menu_item_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Menu item deleted successfully".to_string())
                } else {
                    Err("Menu item not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting menu item: {}", err)),
        }
    }
}