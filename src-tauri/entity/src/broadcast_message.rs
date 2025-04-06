// src-tauri/src/entity/broadcast_message.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, NaiveDateTime}; // Import DateTime and Utc

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "broadcast_message")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub broadcast_message_id: String,
    pub target_audience: String,
    pub content: String,
    pub timestamp: NaiveDateTime, // Use NaiveDateTime as it matches naive_local()
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {} // No relations defined in this simple model

impl ActiveModelBehavior for ActiveModel {}