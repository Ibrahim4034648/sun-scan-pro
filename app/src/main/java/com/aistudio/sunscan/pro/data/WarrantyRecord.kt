package com.aistudio.sunscan.pro.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "warranty_records")
data class WarrantyRecord(
    @PrimaryKey
    val id: String,
    val serial: String,
    val model: String,
    val warrantyYears: Int,
    val installDate: String,
    val customer: String,
    val project: String,
    val location: String,
    val notes: String,
    val createdAt: String
)
