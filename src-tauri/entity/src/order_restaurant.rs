use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "order_restaurant")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub order_restaurant_id: String,
    pub customer_id: String,
    pub restaurant_id: String,
    pub menu_item_id: String,
    pub quantity: i32,
    pub timestamp: DateTime,
    pub status: String,
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
        belongs_to = "super::restaurant::Entity",
        from = "Column::RestaurantId",
        to = "super::restaurant::Column::RestaurantId"
    )]
    Restaurant,
    #[sea_orm(
        belongs_to = "super::menu_item::Entity",
        from = "Column::MenuItemId",
        to = "super::menu_item::Column::MenuItemId"
    )]
    MenuItem,
}

impl Related<super::customer::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Customer.def()
    }
}

impl Related<super::restaurant::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Restaurant.def()
    }
}

impl Related<super::menu_item::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MenuItem.def()
    }
}


impl ActiveModelBehavior for ActiveModel {}