package com.aistudio.sunscan.pro.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface WarrantyDao {
    @Query("SELECT * FROM warranty_records ORDER BY createdAt DESC")
    fun getAllRecords(): Flow<List<WarrantyRecord>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: WarrantyRecord)

    @Query("DELETE FROM warranty_records WHERE id = :id")
    suspend fun deleteRecordById(id: String)
}
