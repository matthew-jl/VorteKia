use sea_orm::{ActiveModelTrait, EntityTrait, QueryOrder};
use entity::ride::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{cache_delete, cache_get, cache_set, ApiResponse, AppState};

pub struct RideHandler;

impl RideHandler {
    // View all rides
    pub async fn view_rides(state: &AppState) -> Result<ApiResponse<Vec<Model>>, String> {
        let cache_key = "view_rides_cache";

        // Check Redis cache first
        if let Some(cached_rides) = cache_get::<Vec<Model>>(&state.redis_pool, cache_key).await {
            println!("Cache hit: Returning rides from Redis");
            return Ok(ApiResponse::success(cached_rides));
        }

        // Cache miss: Query the database
        println!("Cache miss: Querying database");
        match ride::Entity::find()
            .order_by_asc(ride::Column::Name)
            .all(&state.db)
            .await
        {
            Ok(rides) => {
                // Cache the result for 60 seconds
                cache_set(&state.redis_pool, cache_key, &rides, 60).await;
                Ok(ApiResponse::success(rides))
            }
            Err(err) => Ok(ApiResponse::error(format!("Error fetching rides: {}", err))),
        }
    }

    // Get ride details by ID
    pub async fn get_ride_details(
        state: &AppState,
        ride_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match ride::Entity::find_by_id(ride_id.clone()).one(&state.db).await {
            Ok(Some(ride_details)) => Ok(ApiResponse::success(ride_details)),
            Ok(None) => Err("Ride not found".to_string()),
            Err(err) => Err(format!("Database error fetching ride details: {}", err)),
        }
    }

    // Save ride data (create new ride)
    pub async fn save_ride_data(
        state: &AppState,
        status: String,
        name: String,
        price: String,
        location: String,
        staff_id: String,
        photo: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let ride_id = Uuid::new_v4().to_string();

        let new_ride = ride::ActiveModel {
            ride_id: sea_orm::ActiveValue::Set(ride_id),
            status: sea_orm::ActiveValue::Set(status),
            name: sea_orm::ActiveValue::Set(name),
            price: sea_orm::ActiveValue::Set(price),
            location: sea_orm::ActiveValue::Set(location),
            staff_id: sea_orm::ActiveValue::Set(staff_id),
            photo: sea_orm::ActiveValue::Set(photo),
            ..Default::default()
        };

        match ride::Entity::insert(new_ride).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_rides_cache").await;
                Ok(ApiResponse::success("Ride created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating ride: {}", err)),
        }
    }

    // Update ride data
    pub async fn update_ride_data(
        state: &AppState,
        ride_id: String,
        status: Option<String>,
        name: Option<String>,
        price: Option<String>,
        location: Option<String>,
        staff_id: Option<String>,
        photo: Option<Option<String>>, // Option<Option<String>> to allow setting to NULL
    ) -> Result<ApiResponse<String>, String> {
        let ride_record = match ride::Entity::find_by_id(ride_id).one(&state.db).await {
            Ok(Some(ride)) => ride,
            Ok(None) => return Err("Ride not found".to_string()),
            Err(err) => return Err(format!("Error fetching ride: {}", err)),
        };

        let mut active_ride: ride::ActiveModel = ride_record.into();

        if let Some(new_status) = status {
            active_ride.status = sea_orm::ActiveValue::Set(new_status);
        }
        if let Some(new_name) = name {
            active_ride.name = sea_orm::ActiveValue::Set(new_name);
        }
        if let Some(new_price) = price {
            active_ride.price = sea_orm::ActiveValue::Set(new_price);
        }
        if let Some(new_location) = location {
            active_ride.location = sea_orm::ActiveValue::Set(new_location);
        }
        if let Some(new_staff_id) = staff_id {
            active_ride.staff_id = sea_orm::ActiveValue::Set(new_staff_id);
        }
        if let Some(new_photo) = photo {
            active_ride.photo = sea_orm::ActiveValue::Set(new_photo);
        }

        match active_ride.update(&state.db).await {
            Ok(_) => { 
                cache_delete(&state.redis_pool, "view_rides_cache").await;
                Ok(ApiResponse::success("Ride updated successfully".to_string()))
            }
            Err(err) => Err(format!("Error updating ride: {}", err)),
        }
    }

    // Delete ride data
    pub async fn delete_ride_data(state: &AppState, ride_id: String) -> Result<String, String> {
        match ride::Entity::delete_by_id(ride_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    cache_delete(&state.redis_pool, "view_rides_cache").await;
                    Ok("Ride deleted successfully".to_string())
                } else {
                    Err("Ride not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting ride: {}", err)),
        }
    }
}