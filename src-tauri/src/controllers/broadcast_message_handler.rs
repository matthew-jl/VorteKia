use sea_orm::{ActiveModelTrait, ColumnTrait, Condition, EntityTrait, QueryFilter, QueryOrder, Set};
use entity::broadcast_message::{self, ActiveModel, Model};
use uuid::Uuid;
use crate::{ApiResponse, AppState};
use chrono::{Utc, FixedOffset, DateTime, NaiveDateTime}; // Import required chrono types

pub struct BroadcastMessageHandler;

impl BroadcastMessageHandler {
    // View all broadcast messages
    pub async fn view_broadcast_messages(
        state: &AppState,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        match broadcast_message::Entity::find()
            .order_by_desc(broadcast_message::Column::Timestamp) // Order by most recent first
            .all(&state.db)
            .await
        {
            Ok(messages) => Ok(ApiResponse::success(messages)),
            Err(err) => Err(format!("Error fetching broadcast messages: {}", err)),
        }
    }

    // View broadcast messages by target audience
    pub async fn view_broadcast_messages_by_audience(
        state: &AppState,
        target_audience: String,
    ) -> Result<ApiResponse<Vec<Model>>, String> {
        // Basic validation for audience type
        if target_audience != "Customer" && target_audience != "Staff" {
            return Err("Invalid target audience. Must be 'Customer' or 'Staff'".to_string());
        }

        match broadcast_message::Entity::find()
            .filter(
                Condition::all() // Combine filters
                    .add(broadcast_message::Column::TargetAudience.eq(target_audience))
                    .add(broadcast_message::Column::Status.eq("Sent")) // Filter for "Sent" status
            )
            .order_by_desc(broadcast_message::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(messages) => Ok(ApiResponse::success(messages)),
            Err(err) => Err(format!("Error fetching sent broadcast messages by audience: {}", err)),
        }
    }

    // Get broadcast message details by ID
    pub async fn get_broadcast_message_details(
        state: &AppState,
        broadcast_message_id: String,
    ) -> Result<ApiResponse<Model>, String> {
        match broadcast_message::Entity::find_by_id(broadcast_message_id).one(&state.db).await {
            Ok(Some(message_details)) => Ok(ApiResponse::success(message_details)),
            Ok(None) => Err("Broadcast message not found".to_string()),
            Err(err) => Err(format!("Database error fetching broadcast message details: {}", err)),
        }
    }

    // Save broadcast message data (create new message)
    pub async fn save_broadcast_message_data(
        state: &AppState,
        target_audience: String,
        content: String,
        status: String, // e.g., "Pending" initially
    ) -> Result<ApiResponse<String>, String> {
        let broadcast_message_id = Uuid::new_v4().to_string();
        let jakarta_time: NaiveDateTime = Utc::now() // Use NaiveDateTime to match entity field
            .with_timezone(&FixedOffset::east_opt(7 * 3600).unwrap())
            .naive_local();

        // Basic validation
        if target_audience != "Customer" && target_audience != "Staff" {
            return Err("Invalid target audience. Must be 'Customer' or 'Staff'".to_string());
        }
        if status != "Pending" && status != "Sent" {
             return Err("Invalid status. Must be 'Pending' or 'Sent'".to_string());
        }


        let new_broadcast_message = broadcast_message::ActiveModel {
            broadcast_message_id: Set(broadcast_message_id),
            target_audience: Set(target_audience),
            content: Set(content),
            timestamp: Set(jakarta_time), // Use jakarta_time
            status: Set(status),
            ..Default::default()
        };

        match broadcast_message::Entity::insert(new_broadcast_message).exec(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Broadcast message created successfully".to_string())),
            Err(err) => Err(format!("Error creating broadcast message: {}", err)),
        }
    }

    // Update broadcast message data (e.g., change status from Pending to Sent)
    pub async fn update_broadcast_message_data(
        state: &AppState,
        broadcast_message_id: String,
        target_audience: Option<String>,
        content: Option<String>,
        status: Option<String>,
    ) -> Result<ApiResponse<String>, String> {
        let message_record = match broadcast_message::Entity::find_by_id(broadcast_message_id).one(&state.db).await {
            Ok(Some(message)) => message,
            Ok(None) => return Err("Broadcast message not found".to_string()),
            Err(err) => return Err(format!("Error fetching broadcast message: {}", err)),
        };

        let mut active_message: broadcast_message::ActiveModel = message_record.into();

        if let Some(new_audience) = target_audience {
             if new_audience != "Customer" && new_audience != "Staff" {
                return Err("Invalid target audience. Must be 'Customer' or 'Staff'".to_string());
            }
            active_message.target_audience = Set(new_audience);
        }
        if let Some(new_content) = content {
            active_message.content = Set(new_content);
        }
        if let Some(new_status) = status {
            if new_status != "Pending" && new_status != "Sent" {
                 return Err("Invalid status. Must be 'Pending' or 'Sent'".to_string());
            }
            active_message.status = Set(new_status);
            // Optionally update the timestamp if the status changes to "Sent"?
            // if new_status == "Sent" {
            //     let jakarta_time: NaiveDateTime = Utc::now()
            //         .with_timezone(&FixedOffset::east_opt(7 * 3600).unwrap())
            //         .naive_local();
            //     active_message.timestamp = Set(jakarta_time);
            // }
        }

        match active_message.update(&state.db).await {
            Ok(_) => Ok(ApiResponse::success("Broadcast message updated successfully".to_string())),
            Err(err) => Err(format!("Error updating broadcast message: {}", err)),
        }
    }

    // Delete broadcast message data
    pub async fn delete_broadcast_message_data(state: &AppState, broadcast_message_id: String) -> Result<String, String> {
        match broadcast_message::Entity::delete_by_id(broadcast_message_id).exec(&state.db).await {
            Ok(delete_result) => {
                if delete_result.rows_affected > 0 {
                    Ok("Broadcast message deleted successfully".to_string())
                } else {
                    Err("Broadcast message not found".to_string())
                }
            }
            Err(err) => Err(format!("Error deleting broadcast message: {}", err)),
        }
    }
}