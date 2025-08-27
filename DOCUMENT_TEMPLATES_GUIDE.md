# Document Template System - User Guide

## Overview
The Document Template System allows admins to upload custom document templates (contracts, listings, disclosures, etc.) and automatically generate personalized documents using transaction loop data.

## Features
- ✅ Upload PDF and Word document templates
- ✅ Map template fields to loop data
- ✅ Automatic document generation with pre-filled information
- ✅ Document storage and management
- ✅ Template reuse across multiple transactions
- ✅ Category organization (Contract, Listing, Disclosure, etc.)

## How to Use

### 1. Upload Document Templates
1. Navigate to **Admin Settings** → **Document Templates**
2. Click **"Upload Template"**
3. Select your PDF or Word document
4. Provide template name and description
5. Choose appropriate category
6. Click **"Upload Template"**

### 2. Map Template Fields
1. After uploading, click **"Map Fields"** on your template
2. Add field mappings by:
   - **Field Name**: The placeholder name in your document (e.g., `client_name`)
   - **Loop Field**: Which transaction data to use (e.g., Client Name)
   - **Field Type**: Format (Text, Number, Date, Currency)
3. Click **"Add Field"** for each mapping
4. Save your field mappings

### 3. Prepare Your Document Template
In your document template, use simple field names where you want data inserted:
- Use: `client_name` for client name
- Use: `property_address` for property address
- Use: `sale_amount` for sale amount
- etc.

### 4. Generate Documents from Loops
1. Edit any transaction loop
2. In the **"Loop Documents"** section (admins only)
3. Click **"Generate Document"**
4. Select your mapped template
5. Click **"Generate"**
6. Download the generated document with auto-filled data

## Available Loop Fields for Mapping
- **Property Address** - The property location
- **Client Name** - Primary client name
- **Client Email** - Client email address
- **Client Phone** - Client phone number
- **Sale Amount** - Transaction value (auto-formatted as currency)
- **Status** - Current transaction status
- **Transaction Type** - Type of real estate transaction
- **Start Date** - Transaction start date
- **End Date** - Target close date
- **Tags** - Associated tags
- **Notes** - Additional notes
- **Agent Name** - Creating agent name

## Supported File Formats
- **PDF**: `.pdf` (recommended for contracts and legal documents)
- **Word**: `.doc`, `.docx` (for editable documents)

## File Size Limits
- Maximum file size: 10MB per template

## Categories
- **Contract** - Purchase agreements, sales contracts
- **Listing** - Listing agreements, MLS forms
- **Disclosure** - Property disclosures, lead paint forms
- **Addendum** - Contract addendums, amendments
- **Notice** - Legal notices, notifications
- **Other** - Miscellaneous documents

## Tips for Best Results
1. **Use Simple Field Names**: Keep field names short and descriptive
2. **Test Field Mappings**: Generate a test document to verify field placement
3. **Consistent Formatting**: Use consistent field naming across templates
4. **Template Organization**: Use categories to organize your templates
5. **Regular Updates**: Update field mappings when loop structure changes

## Example Template Field Usage
```
PURCHASE AGREEMENT

Property: property_address
Buyer: client_name
Email: client_email
Phone: client_phone
Purchase Price: sale
Agent: creator_name
Date: start_date
```

## Generated Document Storage
- Generated documents are stored on the server
- Access generated documents from the loop editing page
- Download documents anytime from the loop documents section
- Documents are automatically named with template name, loop ID, and timestamp

## Admin-Only Features
- Only admins can upload and manage templates
- Only admins can map template fields
- Only admins can generate documents from templates
- Regular agents can view generated documents for their loops

## Troubleshooting
- **Template not generating**: Ensure field mappings are saved
- **Fields not populating**: Check field names match exactly
- **File not uploading**: Verify file format and size limits
- **Access denied**: Ensure you have admin privileges

This system streamlines document creation and ensures consistency across all real estate transactions while saving significant time on paperwork preparation.
