// src-tauri/src/entity/chat.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "chat")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub chat_id: String,
    pub name: String,
    pub last_message_text: Option<String>,
    pub last_message_timestamp: Option<DateTime>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::message::Entity")]
    Message,
    #[sea_orm(has_many = "super::chat_member::Entity")]
    ChatMember,
}

impl Related<super::message::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Message.def()
    }
}

impl Related<super::chat_member::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ChatMember.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}