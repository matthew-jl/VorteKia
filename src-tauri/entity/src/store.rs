// src-tauri/src/entity/store.rs

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "store")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub store_id: String,
    pub name: String,
    pub photo: Option<String>,
    pub opening_time: Time,
    pub closing_time: Time,
    pub location: Option<String>,
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::souvenir::Entity")]
    Souvenir,
    #[sea_orm(has_many = "super::order_souvenir::Entity")]
    OrderSouvenir,
}

impl Related<super::souvenir::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Souvenir.def()
    }
}

impl Related<super::order_souvenir::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::OrderSouvenir.def()
    }
}


impl ActiveModelBehavior for ActiveModel {}