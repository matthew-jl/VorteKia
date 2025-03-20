// src-tauri/src/migrations/mYYYYMMDD_HHMMSS_create_chat_member_table.rs
//  (replace YYYYMMDD_HHMMSS with the current date and time)

use sea_orm_migration::{prelude::*, schema::*};

use crate::{
    m20250320_151149_create_chat_table::Chat, // Replace with your actual chat migration file name
    m20250304_152552_create_customer_table::Customer, // Assuming you have this
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ChatMember::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ChatMember::ChatMemberId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ChatMember::ChatId).string().not_null())
                    .col(ColumnDef::new(ChatMember::UserId).string().not_null())
                    .col(
                        ColumnDef::new(ChatMember::JoinedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-chat_member-chat_id")
                            .from(ChatMember::Table, ChatMember::ChatId)
                            .to(Chat::Table, Chat::ChatId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ChatMember::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum ChatMember {
    Table,
    ChatMemberId,
    ChatId,
    UserId,
    JoinedAt,
}