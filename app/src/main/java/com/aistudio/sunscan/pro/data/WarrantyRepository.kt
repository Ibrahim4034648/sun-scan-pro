package com.aistudio.sunscan.pro.data

import kotlinx.coroutines.flow.Flow

class WarrantyRepository(private val dao: WarrantyDao) {
    val allRecords: Flow<List<WarrantyRecord>> = dao.getAllRecords()

    suspend fun insert(record: WarrantyRecord) {
        dao.insertRecord(record)
    }

    suspend fun delete(id: String) {
        dao.deleteRecordById(id)
    }
}
