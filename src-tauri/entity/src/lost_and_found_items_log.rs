use sea_orm::entity::prelude::*;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "lost_and_found_items_log")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub log_id: String,
    pub image: Option<String>,
    pub name: String,
    #[sea_orm(column_name = "type")]
    pub r#type: String, // 'type' is a Rust keyword, mapped to 'type' column
    pub color: String,
    pub last_seen_location: Option<String>,
    pub finder: Option<String>,
    pub owner: Option<String>,
    pub found_location: Option<String>,
    pub timestamp: NaiveDateTime,
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}