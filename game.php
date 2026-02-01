<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parcel Logistics Tycoon</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <!--<link rel="stylesheet" href="style.css">-->
</head>
<body class="overflow-hidden">
    <div id="game-container" class="d-flex flex-column vh-100">
        <!-- Header -->
        <header id="game-header" class="p-3">
            <h1 class="mb-2">Parcel Delivery Tycoon</h1>
            <div id="game-stats" class="mb-2 d-flex gap-2 flex-wrap">
                <div class="btn btn-outline-primary">
                    <span class="stat-label">Day:</span>
                    <span id="day-counter">1</span>
                </div>
                <div class="btn btn-outline-primary">
                    <span class="stat-label">Cash:</span>
                    <span id="cash-display">$0</span>
                </div>
                <div class="btn btn-outline-primary">
                    <span class="stat-label">Loan:</span>
                    <span id="loan-display">$0</span>
                </div>
                <div class="btn btn-outline-primary">
                    <span class="stat-label">Daily Profit:</span>
                    <span id="profit-display">$0</span>
                </div>
                <div class="btn btn-outline-primary">
                    <span class="stat-label">Reputation:</span>
                    <span id="reputation-display">0%</span>
                </div>
            </div>
            <div id="time-controls" class="d-flex gap-2">
                <button id="advance-day" class="btn btn-primary">Advance to Next Day ⏩</button>
                <button id="save-game" class="btn btn-secondary">💾 Save</button>
                <button id="load-game" class="btn btn-secondary">📂 Load</button>
            </div>
        </header>

        <!-- Main Content -->
        <div id="main-content" class="d-flex flex-grow-1 overflow-hidden">
            <!-- Left Panel - Map -->
            <div id="left-panel" class="overflow-hidden rounded-3 flex-grow-1 d-flex flex-column m-1">
                <div id="map-container" class="flex-grow-1 position-relative">
                    <div id="map" class="w-100 h-100"></div>
                </div>
            </div>

            <!-- Right Panel - Management -->
            <div id="right-panel" class="overflow-hidden d-flex flex-column m-1" width="width: 450px;">




                <div class="nav nav-tabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" data-tab="overview" data-bs-toggle="tab" data-bs-target="#overview">Overview</button>
                    </li>
                    </li><li class="nav-item" role="presentation">
                        <button class="nav-link" data-tab="packages" data-bs-toggle="tab" data-bs-target="#packages">Packages</button>
                    </li><li class="nav-item" role="presentation">
                    <button class="nav-link" data-tab="routes" data-bs-toggle="tab" data-bs-target="#routes">Routes</button>
                    </li><li class="nav-item" role="presentation">
                    <button class="nav-link" data-tab="vehicles" data-bs-toggle="tab" data-bs-target="#vehicles">Vehicles</button>
                    </li><li class="nav-item" role="presentation">
                    <button class="nav-link" data-tab="drivers" data-bs-toggle="tab" data-bs-target="#drivers">Drivers</button>
                    </li><li class="nav-item" role="presentation">
                    <button class="nav-link" data-tab="facilities" data-bs-toggle="tab" data-bs-target="#facilities">Facilities</button>
                    </li><li class="nav-item" role="presentation">
                    <button class="nav-link" data-tab="finances" data-bs-toggle="tab" data-bs-target="#finances">Finances</button>
                    </li>
                </div>

                <div class="tab-content" id="myTabContent">

                    <!-- Overview Tab -->
                    <div id="overview" class="tab-pane active" role="tabpanel">
                        <h2>Company Overview</h2>
                        <div id="overview-content">
                            <div class="overview-section">
                                <h3>📊 Today's Summary</h3>
                                <p>Packages in transit: <span id="packages-transit">0</span></p>
                                <p>Packages delivered: <span id="packages-delivered">0</span></p>
                                <p>Active vehicles: <span id="active-vehicles">0</span></p>
                                <p>Active drivers: <span id="active-drivers">0</span></p>
                            </div>
                            <div class="overview-section">
                                <h3>🎯 Business Goals</h3>
                                <ul id="goals-list">
                                    <li>Establish your first depot</li>
                                    <li>Purchase your first vehicle</li>
                                    <li>Hire your first driver</li>
                                    <li>Deliver 10 packages</li>
                                </ul>
                            </div>
                            <div class="overview-section">
                                <h3>📰 News & Events</h3>
                                <div id="news-feed">
                                    <p class="news-item">Welcome to Parcel Logistics Tycoon! Start by establishing your first depot.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Packages Tab -->
                    <div id="packages" class="tab-pane" role="tabpanel">
                        <h2>Package Management</h2>
                        <div id="packages-content">
                            <div class="filter-bar">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="pending">Pending</button>
                                <button class="filter-btn" data-filter="in-transit">In Transit</button>
                                <button class="filter-btn" data-filter="delivered">Delivered</button>
                            </div>
                            <div id="packages-list"></div>
                        </div>
                    </div>

                    <!-- Routes Tab -->
                    <div id="routes" class="tab-pane" role="tabpanel">
                        <h2>Route Management</h2>
                        <div class="routes-help">
                            <p>📍 Click on towns on the map to view pickups/deliveries and dispatch routes</p>
                            <p>🚚 Assign drivers to specific towns to prioritize routes</p>
                        </div>
                        <div id="routes-list"></div>
                    </div>

                    <!-- Vehicles Tab -->
                    <div id="vehicles" class="tab-pane">
                        <h2>Vehicle Fleet</h2>
                        <button id="buy-vehicle" class="btn-primary">🚚 Buy Vehicle</button>
                        <div id="vehicles-list"></div>
                    </div>

                    <!-- Drivers Tab -->
                    <div id="drivers" class="tab-pane">
                        <h2>Driver Management</h2>
                        <button id="hire-driver" class="btn-primary">👤 Hire Driver</button>
                        <div id="drivers-list"></div>
                    </div>

                    <!-- Facilities Tab -->
                    <div id="facilities" class="tab-pane">
                        <h2>Facilities Management</h2>
                        <div class="facility-actions">
                            <button id="buy-depot" class="btn-primary">🏢 Buy Depot</button>
                            <button id="open-dms" class="btn-primary">📋 Dispatch Management System</button>
                            <button id="buy-hub" class="btn-primary" disabled>🏭 Buy Hub (Unlock at Day 30)</button>
                        </div>
                        <div id="facilities-list"></div>
                    </div>

                    <!-- Finances Tab -->
                    <div id="finances" class="tab-pane">
                        <h2>Financial Management</h2>
                        <div id="finances-content">
                            <div class="finance-section">
                                <h3>💰 Loans</h3>
                                <button id="take-loan" class="btn-primary">Take Out Loan</button>
                                <button id="repay-loan" class="btn-secondary">Repay Loan</button>
                                <p>Current loan: $<span id="loan-amount">0</span></p>
                                <p>Daily interest: $<span id="loan-interest">0</span></p>
                            </div>
                            <div class="finance-section">
                                <h3>📈 Revenue Breakdown</h3>
                                <table class="finance-table">
                                    <tr>
                                        <td>Package delivery revenue:</td>
                                        <td>$<span id="revenue-deliveries">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Express delivery bonus:</td>
                                        <td>$<span id="revenue-express">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Total revenue:</td>
                                        <td><strong>$<span id="revenue-total">0</span></strong></td>
                                    </tr>
                                </table>
                            </div>
                            <div class="finance-section">
                                <h3>📉 Expenses Breakdown</h3>
                                <table class="finance-table">
                                    <tr>
                                        <td>Driver wages:</td>
                                        <td>$<span id="expense-wages">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Fuel costs:</td>
                                        <td>$<span id="expense-fuel">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Vehicle maintenance:</td>
                                        <td>$<span id="expense-maintenance">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Facility costs:</td>
                                        <td>$<span id="expense-facilities">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Loan interest:</td>
                                        <td>$<span id="expense-interest">0</span></td>
                                    </tr>
                                    <tr>
                                        <td>Total expenses:</td>
                                        <td><strong>$<span id="expense-total">0</span></strong></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="modal-overlay" class="modal-overlay hidden">
        <div id="modal-content" class="modal-content"></div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast-container" class="toast-container position-absolute" style="top: 5%; right: 2%;"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="game.js?nocache=<?php echo time(); ?>"></script>
</body>
</html>
