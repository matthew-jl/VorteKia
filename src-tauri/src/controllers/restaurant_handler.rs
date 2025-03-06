use sea_orm::{prelude::Time, ActiveModelTrait, EntityTrait, QueryOrder, QuerySelect};
use entity::restaurant::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct RestaurantHandler;

impl RestaurantHandler {
    // View restaurants
    pub async fn view_restaurants(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        match restaurant::Entity::find().order_by_asc(restaurant::Column::Name).all(&state.db).await {
            Ok(restaurants) => Ok(ApiResponse::success(restaurants)),
            Err(err) => Err(format!("Error fetching restaurants: {}", err)),
        }
    }

    // Get restaurant details by ID
    pub async fn get_restaurant_details(
        state: &AppState,
        restaurant_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match restaurant::Entity::find_by_id(restaurant_id.clone()).one(&state.db).await {
            Ok(Some(restaurant_details)) => {
                Ok(ApiResponse::success(restaurant_details))
            }
            Ok(None) => {
                Err("Restaurant not found".to_string())
            }
            Err(err) => {
                Err(format!("Database error fetching restaurant details: {}", err))
            }
        }
    }

    // Save restaurant data (create new restaurant)
    pub async fn save_restaurant_data(
        state: &AppState,
        name: String,
        photo: Option<String>,
        opening_time: String, // Receive as String from frontend, parse to Time
        closing_time: String, // Receive as String from frontend, parse to Time
        cuisine_type: String,
        location: Option<String>,
        status: String,
    ) -> Result<ApiResponse<String>, String> {
        // Generate a UUID for the restaurant_id
        let restaurant_id = Uuid::new_v4().to_string();

        // Parse opening and closing times from String to Time
        let parsed_opening_time = Time::parse_from_str(&opening_time, "%H:%M:%S").map_err(|e| format!("Invalid opening time format: {}", e))?;
        let parsed_closing_time = Time::parse_from_str(&closing_time, "%H:%M:%S").map_err(|e| format!("Invalid closing time format: {}", e))?;


        let new_restaurant = restaurant::ActiveModel {
            restaurant_id: sea_orm::ActiveValue::Set(restaurant_id),
            name: sea_orm::ActiveValue::Set(name),
            photo: sea_orm::ActiveValue::Set(photo),
            opening_time: sea_orm::ActiveValue::Set(parsed_opening_time),
            closing_time: sea_orm::ActiveValue::Set(parsed_closing_time),
            cuisine_type: sea_orm::ActiveValue::Set(cuisine_type),
            location: sea_orm::ActiveValue::Set(location),
            status: sea_orm::ActiveValue::Set(status),
            ..Default::default()
        };

        match restaurant::Entity::insert(new_restaurant).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Restaurant created successfully".to_string())),
            Err(err) => Err(format!("Error creating restaurant: {}", err)),
        }
    }

    // Update restaurant data
    pub async fn update_restaurant_data(
        state: &AppState,
        restaurant_id: String,
        name: Option<String>,
        photo: Option<Option<String>>, // Option<Option<String>> to allow setting photo to NULL (None) or updating with a new Option<String>
        opening_time: Option<String>, // Option<String> for optional update
        closing_time: Option<String>, // Option<String> for optional update
        cuisine_type: Option<String>,
        location: Option<Option<String>>, // Option<Option<String>> for location as well
        status: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let restaurant_record = match restaurant::Entity::find_by_id(restaurant_id).one(&state.db).await {
            Ok(Some(restaurant)) => restaurant,
            Ok(None) => return Err("Restaurant not found".to_string()),
            Err(err) => return Err(format!("Error fetching restaurant: {}", err)),
        };

        let mut active_restaurant: restaurant::ActiveModel = restaurant_record.into();

        if let Some(new_name) = name {
            active_restaurant.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_photo) = photo {
            active_restaurant.photo = sea_orm::ActiveValue::Set(new_photo);
        }
        if let Some(new_opening_time_str) = opening_time {
            let parsed_opening_time = Time::parse_from_str(&new_opening_time_str, "%H:%M:%S").map_err(|e| format!("Invalid opening time format: {}", e))?;
            active_restaurant.opening_time = sea_orm::ActiveValue::Set(parsed_opening_time);
        }
        if let Some(new_closing_time_str) = closing_time {
            let parsed_closing_time = Time::parse_from_str(&new_closing_time_str, "%H:%M:%S").map_err(|e| format!("Invalid closing time format: {}", e))?;
            active_restaurant.closing_time = sea_orm::ActiveValue::Set(parsed_closing_time);
        }
        if let Some(new_cuisine_type) = cuisine_type {
            active_restaurant.cuisine_type = sea_orm::ActiveValue::Set(new_cuisine_type);
        }
        if let Some(new_location) = location {
            active_restaurant.location = sea_orm::ActiveValue::Set(new_location);
        }
        if let Some(new_status) = status {
            active_restaurant.status = sea_orm::ActiveValue::Set(new_status);
        }


        match active_restaurant.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Restaurant updated successfully".to_string())),
            Err(err) => Err(format!("Error updating restaurant: {}", err)),
        }
    }

    // Delete restaurant data
    pub async fn delete_restaurant_data(state: &AppState, restaurant_id: String) -> Result<String, String> {
        match restaurant::Entity::delete_by_id(restaurant_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Restaurant deleted successfully".to_string())
                } else {
                    Err("Restaurant not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting restaurant: {}", err)),
        }
    }
}