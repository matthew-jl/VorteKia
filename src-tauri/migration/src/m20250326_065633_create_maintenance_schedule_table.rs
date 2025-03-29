// src-tauri/src/migrations/mYYYYMMDD_HHMMSS_create_maintenance_schedule_table.rs
//  (replace YYYYMMDD_HHMMSS with the current date and time)

use sea_orm_migration::{prelude::*, schema::*};

use crate::{m20250306_032524_create_staff_table::Staff, m20250307_114130_create_ride_table::Ride};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(MaintenanceSchedule::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(MaintenanceSchedule::MaintenanceTaskId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(MaintenanceSchedule::RideId).string().not_null())
                    .col(ColumnDef::new(MaintenanceSchedule::StaffId).string().not_null())
                    .col(ColumnDef::new(MaintenanceSchedule::Description).text())
                    .col(ColumnDef::new(MaintenanceSchedule::StartDate).date_time().not_null())
                    .col(ColumnDef::new(MaintenanceSchedule::EndDate).date_time().not_null())
                    .col(ColumnDef::new(MaintenanceSchedule::Status).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-maintenance_schedule-ride_id")
                            .from(MaintenanceSchedule::Table, MaintenanceSchedule::RideId)
                            .to(Ride::Table, Ride::RideId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-maintenance_schedule-staff_id")
                            .from(MaintenanceSchedule::Table, MaintenanceSchedule::StaffId)
                            .to(Staff::Table, Staff::StaffId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(MaintenanceSchedule::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum MaintenanceSchedule {
    Table,
    MaintenanceTaskId,
    RideId,
    StaffId,
    Description,
    StartDate,
    EndDate,
    Status,
}