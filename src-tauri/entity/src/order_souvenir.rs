// src-tauri/src/entity/order_souvenir.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "order_souvenir")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub order_souvenir_id: String,
    pub customer_id: String,
    pub store_id: String,
    pub souvenir_id: String,
    pub quantity: i32,
    pub timestamp: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::customer::Entity",
        from = "Column::CustomerId",
        to = "super::customer::Column::CustomerId"
    )]
    Customer,
    #[sea_orm(
        belongs_to = "super::store::Entity",
        from = "Column::StoreId",
        to = "super::store::Column::StoreId"
    )]
    Store,
    #[sea_orm(
        belongs_to = "super::souvenir::Entity",
        from = "Column::SouvenirId",
        to = "super::souvenir::Column::SouvenirId"
    )]
    Souvenir,
}

impl Related<super::customer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Customer.def()
    }
}

impl Related<super::store::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Store.def()
    }
}

impl Related<super::souvenir::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Souvenir.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}