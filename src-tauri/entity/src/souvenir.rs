// src-tauri/src/entity/souvenir.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "souvenir")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub souvenir_id: String,
    pub name: String,
    pub photo: Option<String>,
    pub price: Decimal,
    pub stock: i32,
    pub store_id: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::store::Entity",
        from = "Column::StoreId",
        to = "super::store::Column::StoreId"
    )]
    Store,
    #[sea_orm(has_many = "super::order_souvenir::Entity")]
    OrderSouvenir,
}

impl Related<super::store::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Store.def()
    }
}

impl Related<super::order_souvenir::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::OrderSouvenir.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}