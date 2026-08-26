package com.aistudio.sunscan.pro

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.aistudio.sunscan.pro.data.AppDatabase
import com.aistudio.sunscan.pro.data.WarrantyRecord
import com.aistudio.sunscan.pro.data.WarrantyRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: WarrantyRepository
    val records: StateFlow<List<WarrantyRecord>>

    init {
        val dao = AppDatabase.getDatabase(application).warrantyDao()
        repository = WarrantyRepository(dao)
        records = repository.allRecords.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )
    }

    fun addRecord(record: WarrantyRecord) {
        viewModelScope.launch {
            repository.insert(record)
        }
    }

    fun deleteRecord(id: String) {
        viewModelScope.launch {
            repository.delete(id)
        }
    }
}
