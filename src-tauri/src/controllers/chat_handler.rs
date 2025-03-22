// src-tauri/src/handler/chat_handler.rs

use chrono::{FixedOffset, NaiveDateTime, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, RelationTrait, Set, ModelTrait};
use entity::{chat, chat_member, customer, message, staff};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{ApiResponse, AppState, cache_get, cache_set, cache_delete};
use futures::{future::join_all}; 

// Define a new struct to hold message data with sender name
#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct MessageWithSenderName {
    pub message: message::Model,
    pub sender_name: String,
}

pub struct ChatHandler;

impl ChatHandler {
    // View chats for a specific user (customer or staff)
    pub async fn view_chats(state: &AppState, user_id: String) -> Result<ApiResponse<Vec<chat::Model>>, String> {
        let cache_key = format!("view_chats_user_{}", user_id);

        if let Some(cached_chats) = cache_get::<Vec<chat::Model>>(&state.redis_pool, &cache_key).await {
            println!("Cache hit: Returning chats for user {} from Redis", user_id);
            return Ok(ApiResponse::success(cached_chats));
        }

        match chat_member::Entity::find()
            .filter(chat_member::Column::UserId.eq(user_id.clone()))
            .find_also_related(chat::Entity)
            .all(&state.db)
            .await
        {
            Ok(chat_members_and_chats) => {
                let chats: Vec<chat::Model> = chat_members_and_chats.into_iter()
                    .filter_map(|(_, chat_opt)| chat_opt)
                    .collect();
                cache_set(&state.redis_pool, &cache_key, &chats, 60).await;
                Ok(ApiResponse::success(chats))
            }
            Err(err) => Err(format!("Error fetching chats for user {}: {}", user_id, err)),
        }
    }

    // Get chat details by ID
    pub async fn get_chat_details(
        state: &AppState,
        chat_id: String,
    ) -> Result<ApiResponse<chat::Model>, String> {
        match chat::Entity::find_by_id(chat_id.clone()).one(&state.db).await {
            Ok(Some(chat_details)) => Ok(ApiResponse::success(chat_details)),
            Ok(None) => Err("Chat not found".to_string()),
            Err(err) => Err(format!("Database error fetching chat details: {}", err)),
        }
    }

    // Save chat data (create new chat)
    pub async fn save_chat_data(
        state: &AppState,
        name: String,
    ) -> Result<ApiResponse<String>, String> {
        let chat_id = Uuid::new_v4().to_string();

        let new_chat = chat::ActiveModel {
            chat_id: sea_orm::ActiveValue::Set(chat_id),
            name: sea_orm::ActiveValue::Set(name),
            ..Default::default()
        };

        match chat::Entity::insert(new_chat).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, "view_chats_cache_*").await; // Invalidate all view_chats caches
                Ok(ApiResponse::success("Chat created successfully".to_string()))
            }
            Err(err) => Err(format!("Error creating chat: {}", err)),
        }
    }

    // Get messages for a specific chat
    pub async fn get_messages(
        state: &AppState,
        chat_id: String,
    ) -> Result<ApiResponse<Vec<MessageWithSenderName>>, String> { // Return ApiResponse<Vec<MessageWithSenderName>>
        let cache_key = format!("get_messages_chat_{}", chat_id);

        if let Some(cached_messages) = cache_get::<Vec<MessageWithSenderName>>(&state.redis_pool, &cache_key).await {
            println!("Cache hit: Returning messages with sender names for chat {} from Redis", chat_id);
            return Ok(ApiResponse::success(cached_messages));
        }

        match message::Entity::find()
            .filter(message::Column::ChatId.eq(chat_id.clone()))
            .order_by_asc(message::Column::Timestamp)
            .all(&state.db)
            .await
        {
            Ok(messages) => {
                // println!("Raw messages retrieved for chat {} (count: {}):", chat_id, messages.len());
                // for (index, msg) in messages.iter().enumerate() {
                //     println!(
                //         "[{}] Message ID: {}, Timestamp: {:?}, Content: {:?}",
                //         index, msg.message_id, msg.timestamp, msg.text
                //     );
                // }

                let messages_with_names_futures = messages.into_iter().map(|message| async { // Changed variable name for clarity
                    let sender_name = Self::get_sender_name(state, &message).await?;
                    Ok(MessageWithSenderName {
                        message,
                        sender_name,
                    })
                });

                let results: Vec<Result<MessageWithSenderName, String>> = join_all(messages_with_names_futures).await;
                let messages_with_names: Result<Vec<MessageWithSenderName>, String> = results.into_iter().collect(); // Convert Vec<Result<...>> to Result<Vec<...>>


                match messages_with_names { // Handle the Result<Vec<MessageWithSenderName>, String>
                    Ok(messages_with_names) => {
                        // println!("Messages with sender names for chat {} (count: {}):", chat_id, messages_with_names.len());
                        // for (index, msg_with_name) in messages_with_names.iter().enumerate() {
                        //     println!(
                        //         "[{}] Message ID: {}, Timestamp: {:?}, Content: {:?}, Sender: {}",
                        //         index, msg_with_name.message.message_id, msg_with_name.message.timestamp, 
                        //         msg_with_name.message.text, msg_with_name.sender_name
                        //     );
                        // }

                        cache_set(&state.redis_pool, &cache_key, &messages_with_names, 30).await;
                        Ok(ApiResponse::success(messages_with_names))
                    },
                    Err(err) => Err(err), // Propagate error from get_sender_name calls
                }
            } 
            Err(err) => {
                Err(format!("Database error fetching messages: {}", err))
            }
        }
    }

    // Helper function to get sender name (Customer or Staff)
    async fn get_sender_name(state: &AppState, message: &message::Model) -> Result<String, String> {
        // Try to fetch as Customer first
        if let Some(customer) = message.find_related(customer::Entity).one(&state.db).await.map_err(|e| format!("DB Error: {}", e))? {
            return Ok(customer.name);
        }
        // If not Customer, try to fetch as Staff
        if let Some(staff) = message.find_related(staff::Entity).one(&state.db).await.map_err(|e| format!("DB Error: {}", e))? {
            return Ok(staff.name);
        }
        Ok("Unknown Sender".to_string()) // Default name if not found in either table
    }

    // Save message data (send a new message)
    pub async fn save_message_data(
        state: &AppState,
        chat_id: String,
        sender_id: String,
        text: String,
    ) -> Result<ApiResponse<String>, String> {
        let message_id = Uuid::new_v4().to_string();

        let jakarta_time = Utc::now()
            .with_timezone(&FixedOffset::east_opt(7 * 3600).unwrap())
            .naive_local();

        let new_message = message::ActiveModel {
            message_id: sea_orm::ActiveValue::Set(message_id),
            chat_id: sea_orm::ActiveValue::Set(chat_id.clone()),
            sender_id: sea_orm::ActiveValue::Set(sender_id),
            text: sea_orm::ActiveValue::Set(text.clone()),
            timestamp: sea_orm::ActiveValue::Set(jakarta_time),
            ..Default::default()
        };

        match message::Entity::insert(new_message).exec(&state.db).await {
            Ok(_) => {
                // Update last message info in chat table
                Self::update_last_message_info(state, chat_id.clone(), text, jakarta_time).await?;
                cache_delete(&state.redis_pool, &format!("get_messages_chat_{}", chat_id)).await; // Invalidate message cache
                Ok(ApiResponse::success("Message sent successfully".to_string()))
            }
            Err(err) => Err(format!("Error sending message: {}", err)),
        }
    }

    // Helper function to update last message info in chat table
    async fn update_last_message_info(state: &AppState, chat_id: String, last_message_text: String, jakarta_time: NaiveDateTime) -> Result<(), String> {
        let chat_record = chat::Entity::find_by_id(chat_id.clone()).one(&state.db).await
            .map_err(|err| format!("Error fetching chat for last message update: {}", err))?
            .ok_or_else(|| "Chat not found for last message update".to_string())?;

        let mut active_chat: chat::ActiveModel = chat_record.into();
        active_chat.last_message_text = Set(Some(last_message_text));
        active_chat.last_message_timestamp = Set(Some(jakarta_time));

        active_chat.update(&state.db).await
            .map_err(|err| format!("Error updating chat last message info: {}", err))?;
        Ok(())
    }

    // Save chat member data (add user to chat)
    pub async fn save_chat_member_data(
        state: &AppState,
        chat_id: String,
        user_id: String,
    ) -> Result<ApiResponse<String>, String> {
        let chat_member_id = Uuid::new_v4().to_string();

        let new_chat_member = chat_member::ActiveModel {
            chat_member_id: sea_orm::ActiveValue::Set(chat_member_id),
            chat_id: sea_orm::ActiveValue::Set(chat_id),
            user_id: sea_orm::ActiveValue::Set(user_id.clone()),
            ..Default::default()
        };

        match chat_member::Entity::insert(new_chat_member).exec(&state.db).await {
            Ok(_) => {
                cache_delete(&state.redis_pool, &format!("view_chats_user_{}", user_id)).await; // Invalidate user's chat list cache
                Ok(ApiResponse::success("Chat member added successfully".to_string()))
            }
            Err(err) => Err(format!("Error adding chat member: {}", err)),
        }
    }

    // Get chat members by chat ID (Example of an additional function)
    pub async fn get_chat_members(
        state: &AppState,
        chat_id: String,
    ) -> Result<ApiResponse<Vec<chat_member::Model>>, String> {
        match chat_member::Entity::find()
            .filter(chat_member::Column::ChatId.eq(chat_id.clone()))
            .all(&state.db)
            .await
        {
            Ok(chat_members) => Ok(ApiResponse::success(chat_members)),
            Err(err) => Err(format!("Error fetching chat members for chat {}: {}", chat_id, err)),
        }
    }
}