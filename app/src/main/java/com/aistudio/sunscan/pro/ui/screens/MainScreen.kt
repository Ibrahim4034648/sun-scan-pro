package com.aistudio.sunscan.pro.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.aistudio.sunscan.pro.MainViewModel
import com.aistudio.sunscan.pro.data.WarrantyRecord
import com.aistudio.sunscan.pro.ui.components.ScannerPreview
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MainScreen(viewModel: MainViewModel) {
    val records by viewModel.records.collectAsState()
    var scannedSerial by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            @OptIn(ExperimentalMaterial3Api::class)
            TopAppBar(
                title = { Text("SunScan Pro", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                ScannerPreview(
                    onScan = { serial ->
                        scannedSerial = serial
                    }
                )
            }

            item {
                RegistrationForm(
                    serialFromScan = scannedSerial,
                    onClearScan = { scannedSerial = "" },
                    onAdd = { record ->
                        viewModel.addRecord(record)
                    }
                )
            }

            item {
                Text(
                    text = "Records",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }

            if (records.isEmpty()) {
                item {
                    Text(
                        "No records found.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 16.dp)
                    )
                }
            } else {
                items(records) { record ->
                    RecordItem(
                        record = record,
                        onDelete = { viewModel.deleteRecord(it) }
                    )
                }
            }
        }
    }
}

@Composable
fun RegistrationForm(
    serialFromScan: String,
    onClearScan: () -> Unit,
    onAdd: (WarrantyRecord) -> Unit
) {
    var serial by remember(serialFromScan) { mutableStateOf(serialFromScan) }
    var model by remember { mutableStateOf("") }
    var warrantyYears by remember { mutableStateOf("25") }
    
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val currentDate = sdf.format(Date())
    var installDate by remember { mutableStateOf(currentDate) }
    
    var customer by remember { mutableStateOf("") }
    var project by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    val isValid = serial.isNotBlank() && model.isNotBlank() && customer.isNotBlank()

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("New Registration", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = serial,
                onValueChange = { serial = it },
                label = { Text("Serial Number *") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    label = { Text("Model *") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                OutlinedTextField(
                    value = warrantyYears,
                    onValueChange = { warrantyYears = it },
                    label = { Text("Warranty (Years)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }

            OutlinedTextField(
                value = installDate,
                onValueChange = { installDate = it },
                label = { Text("Install Date") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = customer,
                onValueChange = { customer = it },
                label = { Text("Customer *") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = project,
                onValueChange = { project = it },
                label = { Text("Project") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Location") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )

            Button(
                onClick = {
                    val record = WarrantyRecord(
                        id = UUID.randomUUID().toString(),
                        serial = serial,
                        model = model,
                        warrantyYears = warrantyYears.toIntOrNull() ?: 0,
                        installDate = installDate,
                        customer = customer,
                        project = project,
                        location = location,
                        notes = notes,
                        createdAt = sdf.format(Date())
                    )
                    onAdd(record)
                    
                    // Reset fields
                    serial = ""
                    model = ""
                    warrantyYears = "25"
                    installDate = sdf.format(Date())
                    customer = ""
                    project = ""
                    location = ""
                    notes = ""
                    onClearScan()
                },
                enabled = isValid,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Add Record")
            }
        }
    }
}

@Composable
fun RecordItem(record: WarrantyRecord, onDelete: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded }
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(record.serial, fontWeight = FontWeight.Bold)
                    Text("${record.customer} • ${record.model}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand"
                )
            }

            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(12.dp))
                
                RecordDetailRow("Model", record.model)
                RecordDetailRow("Warranty", "${record.warrantyYears} Years")
                RecordDetailRow("Install Date", record.installDate)
                RecordDetailRow("Project", record.project)
                RecordDetailRow("Location", record.location)
                if (record.notes.isNotBlank()) {
                    RecordDetailRow("Notes", record.notes)
                }

                Spacer(modifier = Modifier.height(8.dp))
                TextButton(
                    onClick = { onDelete(record.id) },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Delete")
                }
            }
        }
    }
}

@Composable
fun RecordDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Text(
            text = "$label:",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(100.dp)
        )
        Text(
            text = value.ifBlank { "—" },
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium
        )
    }
}
