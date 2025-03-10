// src-tauri/src/migrations/mYYYYMMDD_HHMMSS_create_order_restaurant_table.rs
//  (replace YYYYMMDD_HHMMSS with the current date and time)

use sea_orm_migration::{prelude::*, schema::*};

use crate::{
    m20250304_152552_create_customer_table::Customer, 
    m20250306_111959_create_restaurant_table::Restaurant, 
    m20250306_112015_create_menu_item_table::MenuItem,
};
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(OrderRestaurant::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderRestaurant::OrderRestaurantId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::CustomerId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::RestaurantId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::MenuItemId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::Timestamp)
                            .timestamp()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderRestaurant::Status)
                            .string()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_restaurant-customer_id")
                            .from(OrderRestaurant::Table, OrderRestaurant::CustomerId)
                            .to(Customer::Table, Customer::CustomerId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict if you prefer
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_restaurant-restaurant_id")
                            .from(OrderRestaurant::Table, OrderRestaurant::RestaurantId)
                            .to(Restaurant::Table, Restaurant::RestaurantId) // Use your Restaurant Iden
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_restaurant-menu_item_id")
                            .from(OrderRestaurant::Table, OrderRestaurant::MenuItemId)
                            .to(MenuItem::Table, MenuItem::MenuItemId) //Use your MenuItem Iden
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(OrderRestaurant::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum OrderRestaurant {
    Table,
    OrderRestaurantId,
    CustomerId,
    RestaurantId,
    MenuItemId,
    Quantity,
    Timestamp,
    Status,
}