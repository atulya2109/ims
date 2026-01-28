# Inventory Management System (IMS) - User Guide

Welcome to the Inventory Management System (IMS)! This comprehensive guide will walk you through all features and workflows to effectively manage your equipment inventory.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation Overview](#navigation-overview)
3. [Managing Equipment](#managing-equipment)
4. [Managing Users](#managing-users)
5. [Checking Out Equipment](#checking-out-equipment)
6. [Checking In Equipment](#checking-in-equipment)
7. [Viewing History](#viewing-history)
8. [QR Code Generation](#qr-code-generation)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Accessing the System

1. Open your web browser and navigate to the IMS URL
2. You will see the Dashboard with recent activity history

Before using the system, ensure the following are in place:

- **Users are registered** - Register yourself if you're not registered
- **Equipment is inventoried** - Add all equipment to the system
- **QR codes are printed** - Generate and print QR codes for physical items

---

## Navigation Overview

The IMS uses a sidebar navigation layout.

### Sidebar Sections

**Overview Section**
| Link | Description |
|------|-------------|
| **Overview** | View complete history of all checkout and check-in activities |
| **Equipments** | Manage equipment inventory - add, edit, delete, and view items |
| **Users** | Manage user accounts - add, edit, and remove users |

**Actions Section**
| Link | Description |
|------|-------------|
| **Check Out** | Check out equipment for projects |
| **Check In** | Return equipment from checkout |

---

## Managing Equipment

The Equipments page is your central hub for all inventory management tasks.

![Equipments page overview](../screenshots/equipments_overview.png)

#### Viewing the Inventory

The equipment table displays all items in your inventory with the following columns:

| Column        | Description                          |
| ------------- | ------------------------------------ |
| **Name**      | Equipment name/identifier            |
| **Location**  | Storage location (shelf, room, etc.) |
| **Total**     | Total quantity in inventory          |
| **Available** | Currently available quantity         |
| **Actions**   | Edit and delete options              |

**Interactions:**

- **Single-click:** Select the item
- **Double-click:** Open the edit dialog
- **Right-click:** Open context menu with QR code option

### Adding New Equipment

1. Navigate to **Equipments** in the sidebar
2. Click the **New** button in the top-right corner
3. Fill in the equipment form:

![New equipment form](../screenshots/new_item.png)

| Field        | Required            | Description                                                       |
| ------------ | ------------------- | ----------------------------------------------------------------- |
| **Name**     | Yes                 | Equipment name or identifier                                      |
| **Type**     | Yes                 | Select "Unique" for single items or "Multiple" for quantities > 1 |
| **Location** | Yes                 | Storage location (e.g., "Lab Shelf A", "Room 201")                |
| **Quantity** | Yes (Multiple type) | Initial quantity (minimum 1)                                      |

4. Click **Save** to create the equipment

**Important Notes:**

- Unique items always have a quantity of 1
- A unique QR code ID is automatically generated for each item
- The QR code will be used for checkout/check-in scanning

### Editing Equipment

You can edit equipment information in several ways:

**Method 1: Edit Icon**

1. Find the equipment in the table
2. Click the **Edit** (pencil) icon in the Actions column

**Method 2: Double-Click**

1. Double-click any row to open the edit dialog

![Edit equipment dialog](../screenshots/edit_equipment.png)

**Editable Fields:**

- Equipment name
- Storage location
- Total quantity
- Available quantity (cannot exceed total)

**Validation Rules:**

- Available quantity must not exceed total quantity
- All fields are required

### Deleting Equipment

**Single Delete:**

1. Click the **Trash** icon in the Actions column
2. Confirm deletion in the dialog

**Bulk Delete:**

1. Select one or more items using checkboxes
2. Click **Delete** in the action bar
3. Confirm deletion

> **Warning:** Deleting equipment cannot be undone. All checkout history associated with the equipment will be preserved, but the equipment will no longer appear in inventory.

---

## Managing Users

The Users page allows you to manage team members who can check out equipment.

![Users page overview](../screenshots/users_overview.png)

### Viewing Users

The users table displays all registered users with the following columns:

| Column       | Description            |
| ------------ | ---------------------- |
| **ID**       | Custom user identifier |
| **Name**     | First and last name    |
| **Position** | Job position/role      |
| **Email**    | Email address          |

**Interactions:**

- **Single-click:** Select the user
- **Double-click:** Open the edit dialog

### Adding New Users

1. Navigate to **Users** in the sidebar
2. Click **New User** in the top-right corner
3. Fill in the user form:

![New user form](../screenshots/new_user.png)

| Field              | Required    | Description                                          |
| ------------------ | ----------- | ---------------------------------------------------- |
| **ID**             | Yes         | Custom identifier (e.g., employee ID, username)      |
| **First Name**     | Yes         | User's first name                                    |
| **Last Name**      | Yes         | User's last name                                     |
| **Position**       | Yes         | Select from: PhD, Directed Research, Post Doc, Other |
| **Other Position** | Conditional | Required if "Other" is selected                      |
| **Email**          | Yes         | Valid email address                                  |

4. Click **Save** to create the user

### Editing Users

1. Double-click any user row, OR
2. Select a user and click **Edit User**, OR
3. Click the edit icon in the Actions column

![Edit user dialog](../screenshots/edit_user.png)

**Editable Fields:**

- First name
- Last name
- Position
- Email

**Note:** The User ID cannot be changed after creation.

### Deleting Users

1. Select one or more users using checkboxes
2. Click **Delete User(s)** in the action bar
3. Confirm deletion

> **Note:** Deleting a user does not remove their checkout history. Equipment checked out by the user should be returned first.

---

## Checking Out Equipment

The Check Out page allows you to assign equipment to users for projects.

![Check Out page overview](../screenshots/checkout_overview.png)

### Understanding the Checkout Workflow

1. **Add items** - Select equipment to check out (via scan or search)
2. **Set quantities** - Specify how many of each item
3. **Assign user** - Select who is borrowing the equipment
4. **Enter project** - Specify the project name
5. **Complete checkout** - Submit the transaction

### Scanning Equipment with QR Code

For efficient checkouts, use a barcode/QR code scanner:

1. Position your cursor anywhere on the Check Out page
2. Scan the equipment's QR code
3. The scanner sends an Enter key automatically
4. The equipment is added to your selected items

**Requirements:**

- USB barcode/QR code scanner
- Scanner must send characters followed by Enter key
- Equipment must exist and have available quantity

### Manual Search and Add

If you don't have a scanner:

1. Type in the search bar to find equipment by name or location
2. Results appear below with availability information
3. Click **Add** next to the equipment you want

**For Multiple Items:**

- Use the quantity selector (+/-) to specify how many
- Quantity is limited to available stock

### Managing Selected Items

The selected items panel shows all equipment chosen for checkout:

- **Adjust quantities:** Use + and - buttons (for multiple items)
- **Remove items:** Click the X button next to an item
- **Clear all:** Click "Clear All" to remove all selections
- **Total items:** Shows count of unique items and total quantity

### Completing Checkout

Once you've selected items:

1. The checkout form appears at the bottom:

| Field       | Required | Description                         |
| ----------- | -------- | ----------------------------------- |
| **User**    | Yes      | Select the user borrowing equipment |
| **Project** | Yes      | Enter the project name              |

2. Select a user from the dropdown (populated from Users)
3. Enter the project name
4. Click **Checkout**

**Upon Success:**

- Available quantities are decremented
- Checkout record is created
- Success message displays with checkout ID
- Selected items are cleared

**Error Handling:**

- "No items selected" - Add at least one item
- "Equipment not found" - Verify QR code or search
- "Insufficient quantity" - Reduce checkout quantity

---

## Checking In Equipment

The Check In page returns equipment from active checkouts.

![Check In page overview](../screenshots/checkin_overview.png)

### Understanding the Check-In Workflow

1. **Identify equipment** - Scan or search for equipment with checked-out items
2. **Set quantities** - Specify how many to return
3. **Assign user** - Select who is returning the equipment
4. **Enter project** - Specify the associated project
5. **Complete check-in** - Submit the transaction

### Scanning Equipment for Check-In

1. Position cursor on the Check In page
2. Scan the equipment's QR code
3. Equipment is added if it has checked-out items

**Validation:**

- Only equipment with positive checked-out quantity can be checked in
- Unique items are limited to quantity 1

### Searching for Checkable Equipment

The search only shows equipment with items currently checked out:

1. Type equipment name or location
2. Results show "Checked out: X" quantity
3. Use quantity selector to specify return amount
4. Click **Add** to select

### Managing Items to Return

Similar to checkout, the selected items panel shows items being returned:

- Adjust quantities as needed (cannot exceed checked-out amount)
- Remove items that shouldn't be returned
- Use "Clear All" to start over

### Completing Check-In

1. Fill in the check-in form:

| Field       | Required | Description                         |
| ----------- | -------- | ----------------------------------- |
| **User**    | Yes      | Select the user returning equipment |
| **Project** | Yes      | Enter the associated project name   |

2. Click **Check In**

**Upon Success:**

- Available quantities are incremented
- Check-in record is created
- Success message displays with check-in ID

---

## Viewing History

The Overview page displays a complete audit trail of all inventory activities. Data is automatically sorted by date (most recent first).

### History Table Columns

| Column       | Description                   |
| ------------ | ----------------------------- |
| **Product**  | Equipment name                |
| **Project**  | Associated project name       |
| **Quantity** | Number of items               |
| **Activity** | Check-Out or Check-In         |
| **Date**     | Date and time of activity     |
| **By**       | User who performed the action |

**Note:** Each row represents one transaction line item. A single checkout/check-in may appear as multiple rows (one per equipment).

### Empty State

If no history is displayed:

- No checkouts or check-ins have occurred yet
- The system is newly initialized

---

## QR Code Generation

QR codes enable quick scanning during checkout and check-in workflows.

### Generating QR Codes

1. Navigate to **Equipments** page
2. Right-click on the equipment row
3. Select **View QR Code** from the context menu

### QR Code Viewer

The QR code dialog displays:

![QR code viewer dialog](../screenshots/qr_code.png)

- **QR Code:** The equipment's unique QR code
- **Equipment Name:** Human-readable label
- **Print Button:** Print the QR code label

### Printing QR Codes

1. Click the **Print** button in the QR code dialog
2. The print preview shows the QR code with equipment name
3. Configure print settings (page size, margins)
4. Click **Print**

**Print Best Practices:**

- Use label paper for adhesive labels
- Ensure QR code is at least 1 inch square for reliable scanning
- Print in high contrast (black on white)

### Physical Labeling

Apply printed QR codes to corresponding physical equipment:

- Clean the surface before applying
- Place in a visible, accessible location
- Protect with clear tape for durability (optional)

---

**Document Version:** 1.0
**Last Updated:** January 2026
**For IMS Version:** 1.0 (MVP)
