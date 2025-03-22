// src-tauri/src/entity/message.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "message")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub message_id: String,
    pub chat_id: String,
    pub sender_id: String,
    pub text: String,
    pub timestamp: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::chat::Entity",
        from = "Column::ChatId",
        to = "super::chat::Column::ChatId"
    )]
    Chat,
    // Define optional relations to Customer and Staff
    #[sea_orm(
        belongs_to = "super::customer::Entity", // Relation to Customer
        from = "Column::SenderId",
        to = "super::customer::Column::CustomerId",
        on_delete = "NoAction", // Adjust on_delete action as needed
        on_update = "NoAction"
    )]
    Customer,
    #[sea_orm(
        belongs_to = "super::staff::Entity",     // Relation to Staff
        from = "Column::SenderId",
        to = "super::staff::Column::StaffId",
        on_delete = "NoAction", // Adjust on_delete action as needed
        on_update = "NoAction"
    )]
    Staff,
}

impl Related<super::chat::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Chat.def()
    }
}

impl Related<super::customer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Customer.def()
    }
}

impl Related<super::staff::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Staff.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}