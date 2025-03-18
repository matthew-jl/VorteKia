use chrono::Utc;
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter, QueryOrder, ColumnTrait};
use entity::ride_queue::{self, ActiveModel, Model};
use rust_decimal::Decimal;
use uuid::Uuid;
use crate::{ApiResponse, AppState};

pub struct RideQueueHandler;

impl RideQueueHandler {
    // View queue entries for a specific ride (or all if ride_id is None)
    pub async fn view_ride_queues(
        state: &AppState,
        ride_id: Option<String>,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        let mut query = ride_queue::Entity::find().order_by_asc(ride_queue::Column::QueuePosition);

        if let Some(ride_id) = ride_id {
            query = query.filter(ride_queue::Column::RideId.eq(ride_id));
        }

        match query.all(&state.db).await {
            Ok(ride_queues) => Ok(ApiResponse::success(ride_queues)),
            Err(err) => Err(format!("Error fetching ride queues: {}", err)),
        }
    }

    // Save ride queue data (create new queue entry)
    pub async fn save_ride_queue_data(
        state: &AppState,
        ride_id: String,
        customer_id: String,
        queue_position: Decimal,
    ) -> Result<ApiResponse<String>, String> {
        let ride_queue_id = Uuid::new_v4().to_string();

        let jakarta_time = Utc::now()
            .with_timezone(&chrono::FixedOffset::east_opt(7 * 3600).unwrap())
            .naive_local();

        let new_ride_queue = ride_queue::ActiveModel {
            ride_queue_id: sea_orm::ActiveValue::Set(ride_queue_id),
            ride_id: sea_orm::ActiveValue::Set(ride_id),
            joined_at: sea_orm::ActiveValue::Set(jakarta_time), // Auto-set to current time
            customer_id: sea_orm::ActiveValue::Set(customer_id),
            queue_position: sea_orm::ActiveValue::Set(queue_position),
            ..Default::default()
        };

        match ride_queue::Entity::insert(new_ride_queue).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Ride queue entry created successfully".to_string())),
            Err(err) => Err(format!("Error creating ride queue entry: {}", err)),
        }
    }

    // Update queue position for a specific ride queue entry
    pub async fn update_queue_position(
        state: &AppState,
        ride_queue_id: String,
        queue_position: Decimal,
    ) -> Result<ApiResponse<String>, String> {
        let ride_queue_record = match ride_queue::Entity::find_by_id(ride_queue_id).one(&state.db).await {
            Ok(Some(ride_queue)) => ride_queue,
            Ok(None) => return Err("Ride queue entry not found".to_string()),
            Err(err) => return Err(format!("Error fetching ride queue entry: {}", err)),
        };

        let mut active_ride_queue: ride_queue::ActiveModel = ride_queue_record.into();
        active_ride_queue.queue_position = sea_orm::ActiveValue::Set(queue_position);

        match active_ride_queue.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Queue position updated successfully".to_string())),
            Err(err) => Err(format!("Error updating queue position: {}", err)),
        }
    }

    // Delete ride queue data
    pub async fn delete_ride_queue_data(state: &AppState, ride_queue_id: String) -> Result<String, String> {
        match ride_queue::Entity::delete_by_id(ride_queue_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Ride queue entry deleted successfully".to_string())
                } else {
                    Err("Ride queue entry not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting ride queue entry: {}", err)),
        }
    }
}