use sea_orm_migration::{prelude::*, schema::*};

use crate::{m20250304_152552_create_customer_table::Customer, m20250307_114130_create_ride_table::Ride};


#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(RideQueue::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(RideQueue::RideQueueId).string().not_null().primary_key())
                    .col(ColumnDef::new(RideQueue::RideId).string().not_null())
                    .col(ColumnDef::new(RideQueue::JoinedAt).timestamp().not_null())
                    .col(ColumnDef::new(RideQueue::CustomerId).string().not_null())
                    .col(ColumnDef::new(RideQueue::QueuePosition).decimal().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-ride_queue-ride_id")
                            .from(RideQueue::Table, RideQueue::RideId)
                            .to(Ride::Table, Ride::RideId)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-ride_queue-customer_id")
                            .from(RideQueue::Table, RideQueue::CustomerId)
                            .to(Customer::Table, Customer::CustomerId)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(RideQueue::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum RideQueue {
    Table,
    RideQueueId,
    RideId,
    JoinedAt,
    CustomerId,
    QueuePosition,
}