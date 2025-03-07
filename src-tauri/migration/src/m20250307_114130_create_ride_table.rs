use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250306_032524_create_staff_table::Staff;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Ride::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Ride::RideId).string().not_null().primary_key())
                    .col(ColumnDef::new(Ride::Status).string().not_null())
                    .col(ColumnDef::new(Ride::Name).string().not_null())
                    .col(ColumnDef::new(Ride::Price).string().not_null())
                    .col(ColumnDef::new(Ride::Location).string().not_null())
                    .col(ColumnDef::new(Ride::StaffId).string().not_null())
                    .col(ColumnDef::new(Ride::Photo).string())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-ride-staff_id")
                            .from(Ride::Table, Ride::StaffId)
                            .to(Staff::Table, Staff::StaffId)
                            .on_delete(ForeignKeyAction::Cascade)
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Ride::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Ride {
    Table,
    RideId,
    Status,
    Name,
    Price,
    Location,
    StaffId,
    Photo,
}