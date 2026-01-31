// Parcel Logistics Tycoon - Game Engine


class LogisticsGame {
    constructor() {
        this.state = {
            day: 1,
            cash: 250000,
            loan: 50000,
            reputation: 50,
            depots: [],
            hubs: [],
            vehicles: [],
            drivers: [],
            routes: [],
            packages: [],
            finances: {
                revenue: { deliveries: 0, express: 0 },
                expenses: { wages: 0, fuel: 0, maintenance: 0, facilities: 0, interest: 0 }
            },
            stats: {
                totalDeliveries: 0,
                onTimeDeliveries: 0,
                lateDeliveries: 0
            }
        };
        
        this.selectedTown = null;
        this.townMarkers = {};
        
        this.map = null;
        this.markers = [];
        this.routes = [];
        
        // Game constants
        this.LOAN_INTEREST_RATE = 0.02; // 2% daily
        this.DEPOT_COST = 30000;
        this.HUB_COST = 100000;
        this.VEHICLE_TYPES = {
            van: { name: 'Package Car', cost: 15000, capacity: 20, speed: 50, fuelCost: 0.15 },
            semi: { name: 'Semi Truck', cost: 80000, capacity: 200, speed: 60, fuelCost: 0.50 }
        };
        this.DRIVER_WAGE = 200; // per day
        this.BASE_DELIVERY_RATE = 15; // per package
        this.EXPRESS_BONUS = 10; // bonus for on-time delivery
        this.STOPS_PER_HOUR = 15; // average stops per hour
        this.MAX_HOURS_DOT = 14; // DOT regulation max hours
        this.OVERTIME_THRESHOLD = 8; // regular hours before overtime
        this.TOWNS = [];
        this.STARTING_TOWNS = [];
        this.STARTING_LOCATION = null;

        this.loadCitys();
        

    }

    loadCitys(){
        fetch('./mn.json')
        .then(response => response.json())
        .then(data => {
            this.TOWNS = data;
            let starting_city = prompt("Enter your starting city:", "Glencoe");
            this.STARTING_TOWNS = this.TOWNS.filter(t => t.name === starting_city);
            if (this.STARTING_TOWNS.length === 0) {
                this.STARTING_TOWNS = this.TOWNS.filter(t => t.name === "Glencoe");
                alert("Starting city not found. Defaulting to Glencoe.");
            }
            this.STARTING_LOCATION = this.STARTING_TOWNS[0].location;
            let starting_town_count = 5;
            while (this.STARTING_TOWNS.length < starting_town_count) {
                this.STARTING_TOWNS.push(this.getNextNearest(this.STARTING_LOCATION, this.STARTING_TOWNS));
            }
            this.init();
        })
        .catch(error => console.error('Error loading city data:', error));
    }
    
    init() {
        this.initMap();
        this.bindEvents();
        this.updateUI();
        this.showWelcomeModal();
        
        // Generate initial packages
        this.generatePackages(5);
    }
    
    initMap() {
        // Initialize Leaflet map centered on starting area
        this.map = L.map('map').setView(this.STARTING_LOCATION, 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        // Add starting town markers
        this.STARTING_TOWNS.forEach(town => {
            const marker = L.marker([town.location[0], town.location[1]]).addTo(this.map);
            marker.bindPopup(`<b>${town.name}</b><br>Click to view packages`);
            marker.on('click', () => this.showTownDispatch(town));
            this.townMarkers[town.name] = marker;
        });
    }
    haversine([lat1, lon1], [lat2, lon2]) {
        const R = 6371; // km
        const toRad = d => d * Math.PI / 180;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    getNextNearest(startLocation, startingTowns) {
        let nearest = null;
        let nearestDist = Infinity;

        const excludedNames = new Set(startingTowns.map(t => t.name));

        for (const town of this.TOWNS) {
            if (excludedNames.has(town.name)) continue;

            const dist = this.haversine(startLocation, town.location);

            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = town;
            }
        }

        return nearest;
    }

    
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Close modal on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') this.closeModal();
        });
        
        // Main actions
        document.getElementById('advance-day').addEventListener('click', () => this.advanceDay());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        
        // Purchase actions
        document.getElementById('buy-depot').addEventListener('click', () => this.showDepotPurchaseModal());
        document.getElementById('open-dms').addEventListener('click', () => this.showDMS());
        document.getElementById('buy-vehicle').addEventListener('click', () => this.showVehiclePurchaseModal());
        document.getElementById('hire-driver').addEventListener('click', () => this.showDriverHireModal());
        document.getElementById('take-loan').addEventListener('click', () => this.showLoanModal());
        document.getElementById('repay-loan').addEventListener('click', () => this.repayLoan());
        
        // Package filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterPackages(btn.dataset.filter));
        });
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Update content when switching tabs
        if (tabName === 'packages') this.renderPackages();
        if (tabName === 'routes') this.renderRoutes();
        if (tabName === 'vehicles') this.renderVehicles();
        if (tabName === 'drivers') this.renderDrivers();
        if (tabName === 'facilities') this.renderFacilities();
        if (tabName === 'finances') this.renderFinances();
    }
    
    advanceDay() {
        // Process current day's operations
        this.processDeliveries();
        this.calculateFinances();
        
        // Advance to next day
        this.state.day++;
        
        // Daily operations
        this.generatePackages(Math.floor(Math.random() * 5) + 3);
        this.payDailyCosts();
        this.updateReputation();
        
        // Auto-dispatch routes
        const dispatched = this.autoDispatchRoutes();
        if (dispatched > 0) {
            this.showToast(`Auto-dispatched ${dispatched} routes for pickup`, 'success');
        }
        
        // Unlock features
        if (this.state.day === 30) {
            document.getElementById('buy-hub').disabled = false;
            this.showToast('Hub facilities unlocked!', 'success');
        }
        
        this.updateUI();
        this.showToast(`Day ${this.state.day} begins`, 'info');
    }
    
    processDeliveries() {
        let deliveredCount = 0;
        
        // Process deliveries from previous day's pickups
        this.state.packages.forEach(pkg => {
            if (pkg.status === 'in-transit' && pkg.pickupDay && pkg.pickupDay < this.state.day) {
                const deliverySuccess = Math.random() > 0.1; // 90% success rate
                
                if (deliverySuccess) {
                    pkg.status = 'delivered';
                    pkg.deliveryDay = this.state.day;
                    
                    const onTime = (this.state.day - pkg.createdDay) <= 2; // 2 days for pickup+delivery
                    if (onTime) {
                        this.state.stats.onTimeDeliveries++;
                        this.state.finances.revenue.express += this.EXPRESS_BONUS;
                    } else {
                        this.state.stats.lateDeliveries++;
                    }
                    
                    this.state.finances.revenue.deliveries += this.BASE_DELIVERY_RATE;
                    this.state.stats.totalDeliveries++;
                    deliveredCount++;
                }
            }
        });
        
        // Mark yesterday's pickup routes as completed
        this.state.routes.forEach(route => {
            if (route.status === 'active' && route.day < this.state.day) {
                route.status = 'completed';
            }
        });
        
        if (deliveredCount > 0) {
            this.showToast(`Delivered ${deliveredCount} packages today!`, 'success');
        }
    }
    
    autoDispatchRoutes() {
        // Group pending packages by origin town
        const pendingPackages = this.state.packages.filter(p => p.status === 'pending');
        if (pendingPackages.length === 0) return 0;
        
        const packagesByTown = {};
        pendingPackages.forEach(pkg => {
            const town = pkg.origin.name;
            if (!packagesByTown[town]) packagesByTown[town] = [];
            packagesByTown[town].push(pkg);
        });
        
        // Find available drivers (not on active pickup routes today)
        const activeDrivers = this.state.routes
            .filter(r => r.status === 'active' && r.day === this.state.day)
            .map(r => r.driverId);
        
        const availableDrivers = this.state.drivers.filter(d => 
            d.assignedVehicle && d.assignedRoute && !activeDrivers.includes(d.id)
        );
        
        let dispatchCount = 0;
        
        // Dispatch based on configured routes
        availableDrivers.forEach(driver => {
            // Find the driver's configured route
            const depot = this.state.depots.find(d => d.id === driver.depotId);
            const configuredRoute = depot?.configuredRoutes.find(r => r.id === driver.assignedRoute);
            
            if (!configuredRoute || configuredRoute.towns.length === 0) return;
            
            const vehicle = this.state.vehicles.find(v => v.id === driver.assignedVehicle);
            if (!vehicle) return;
            
            const vehicleType = this.VEHICLE_TYPES[vehicle.type];
            
            // Collect packages from route's towns
            let packagesToLoad = [];
            configuredRoute.towns.forEach(town => {
                if (packagesByTown[town]) {
                    packagesToLoad = packagesToLoad.concat(packagesByTown[town]);
                }
            });
            
            if (packagesToLoad.length === 0) return;
            
            packagesToLoad = packagesToLoad.slice(0, vehicleType.capacity);
            
            // Create active pickup route
            const activeRoute = {
                id: `ROUTE${Date.now()}${Math.random()}`,
                driverId: driver.id,
                vehicleId: vehicle.id,
                configuredRouteId: configuredRoute.id,
                towns: configuredRoute.towns,
                packages: packagesToLoad.map(p => p.id),
                status: 'active',
                day: this.state.day
            };
            
            this.state.routes.push(activeRoute);
            dispatchCount++;
            
            // Mark packages as picked up (in-transit)
            packagesToLoad.forEach(pkg => {
                pkg.status = 'in-transit';
                pkg.assignedRoute = activeRoute.id;
                pkg.pickupDay = this.state.day;
                
                const distance = this.calculateDistance(pkg.origin, pkg.destination);
                this.state.finances.expenses.fuel += distance * vehicleType.fuelCost;
            });
            
            // Remove picked up packages from the list
            packagesToLoad.forEach(pkg => {
                const town = pkg.origin.name;
                if (packagesByTown[town]) {
                    packagesByTown[town] = packagesByTown[town].filter(p => p.id !== pkg.id);
                }
            });
        });
        
        return dispatchCount;
    }
    
    generatePackages(count) {
        for (let i = 0; i < count; i++) {
            // Random origin and destination from available towns
            const originTown = this.STARTING_TOWNS[Math.floor(Math.random() * this.STARTING_TOWNS.length)];
            let destTown = this.STARTING_TOWNS[Math.floor(Math.random() * this.STARTING_TOWNS.length)];
            
            // Ensure origin and destination are different
            while (destTown.name === originTown.name) {
                destTown = this.STARTING_TOWNS[Math.floor(Math.random() * this.STARTING_TOWNS.length)];
            }
            
            const pkg = {
                id: `PKG${Date.now()}${i}`,
                origin: { lat: originTown.lat, lon: originTown.lon, name: originTown.name },
                destination: { lat: destTown.lat, lon: destTown.lon, name: destTown.name },
                weight: Math.floor(Math.random() * 50) + 1,
                status: 'pending',
                createdDay: this.state.day,
                assignedVehicle: null,
                assignedDepot: null,
                deliveryDay: null
            };
            
            this.state.packages.push(pkg);
        }
    }
    
    calculateFinances() {
        // Calculate daily maintenance
        this.state.finances.expenses.maintenance = this.state.vehicles.length * 50;
        
        // Calculate facility costs
        this.state.finances.expenses.facilities = (this.state.depots.length * 100) + (this.state.hubs.length * 500);
        
        // Calculate loan interest
        this.state.finances.expenses.interest = Math.floor(this.state.loan * this.LOAN_INTEREST_RATE);
        this.state.loan += this.state.finances.expenses.interest;
        
        // Calculate driver wages
        this.state.finances.expenses.wages = this.state.drivers.length * this.DRIVER_WAGE;
    }
    
    payDailyCosts() {
        const totalExpenses = Object.values(this.state.finances.expenses).reduce((a, b) => a + b, 0);
        this.state.cash -= totalExpenses;
        
        if (this.state.cash < 0) {
            this.showToast('Warning: Negative cash flow! Consider taking a loan.', 'warning');
        }
    }
    
    updateReputation() {
        const onTimeRate = this.state.stats.totalDeliveries > 0 
            ? (this.state.stats.onTimeDeliveries / this.state.stats.totalDeliveries) * 100 
            : 50;
        this.state.reputation = Math.floor((this.state.reputation + onTimeRate) / 2);
    }
    
    showDMS() {
        if (this.state.depots.length === 0) {
            this.showToast('You need a depot first!', 'error');
            return;
        }
        
        const depot = this.state.depots[0]; // For now, use first depot
        
        const modal = `
            <h2>🏢 Dispatch Management System - ${depot.location.name}</h2>
            <div class="dms-container">
                <div class="dms-status-section">
                    <h3>📊 System Status</h3>
                    <div class="dms-status-grid">
                        <div class="status-item">
                            <strong>Ready Drivers:</strong> 
                            ${this.state.drivers.filter(d => d.depotId === depot.id && d.assignedVehicle && d.assignedRoute).length}
                        </div>
                        <div class="status-item">
                            <strong>Needs Vehicle:</strong> 
                            ${this.state.drivers.filter(d => d.depotId === depot.id && !d.assignedVehicle).length}
                        </div>
                        <div class="status-item">
                            <strong>Needs Route:</strong> 
                            ${this.state.drivers.filter(d => d.depotId === depot.id && d.assignedVehicle && !d.assignedRoute).length}
                        </div>
                        <div class="status-item">
                            <strong>Active Today:</strong> 
                            ${this.state.routes.filter(r => r.status === 'active' && r.day === this.state.day).length}
                        </div>
                    </div>
                    <p class="dms-help">💡 Drivers need a vehicle AND a route assignment to auto-dispatch</p>
                </div>
                <div class="dms-section">
                    <div class="dms-header">
                        <h3>📋 Configured Routes</h3>
                        <button onclick="game.createNewRoute('${depot.id}')" class="btn-primary">+ New Route</button>
                    </div>
                    <div class="dms-routes-list">
                        ${depot.configuredRoutes.length > 0 ? depot.configuredRoutes.map(route => {
                            const driver = this.state.drivers.find(d => d.assignedRoute === route.id);
                            const driversCount = this.state.drivers.filter(d => d.assignedRoute === route.id).length;
                            return `
                                <div class="dms-route-card">
                                    <div class="route-card-header">
                                        <h4>${route.name}</h4>
                                        <button onclick="game.deleteRoute('${depot.id}', '${route.id}')" class="btn-delete">×</button>
                                    </div>
                                    <div class="route-card-body">
                                        <p><strong>Towns:</strong> ${route.towns.length > 0 ? route.towns.join(', ') : 'None assigned'}</p>
                                        <p><strong>Drivers:</strong> ${driversCount} assigned</p>
                                        <div class="route-actions">
                                            <button onclick="game.editRoute('${depot.id}', '${route.id}')" class="btn-secondary">Edit Towns</button>
                                            <button onclick="game.manageRouteDrivers('${depot.id}', '${route.id}')" class="btn-secondary">Manage Drivers</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="no-items">No routes configured. Create a route to get started.</p>'}
                    </div>
                </div>
                
                <div class="dms-section">
                    <h3>👥 Depot Drivers</h3>
                    <div class="dms-drivers-list">
                        ${this.state.drivers.filter(d => d.depotId === depot.id).map(driver => {
                            const vehicle = this.state.vehicles.find(v => v.id === driver.assignedVehicle);
                            const route = depot.configuredRoutes.find(r => r.id === driver.assignedRoute);
                            return `
                                <div class="dms-driver-card">
                                    <strong>${driver.name}</strong>
                                    <br>Vehicle: ${vehicle?.name || 'None'}
                                    <br>Route: ${route?.name || 'Unassigned'}
                                </div>
                            `;
                        }).join('')}
                        ${this.state.drivers.filter(d => d.depotId === depot.id).length === 0 ? '<p class="no-items">No drivers at this depot</p>' : ''}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button onclick="game.closeModal()" class="btn-primary">Close</button>
            </div>
        `;
        
        this.showModal(modal);
    }
    
    createNewRoute(depotId) {
        const depot = this.state.depots.find(d => d.id === depotId);
        if (!depot) return;
        
        const routeName = prompt('Enter route name (e.g., "North Route", "Route 1")');
        if (!routeName) return;
        
        const newRoute = {
            id: `ROUTE_CONFIG${Date.now()}`,
            name: routeName,
            towns: [],
            depotId: depotId
        };
        
        depot.configuredRoutes.push(newRoute);
        this.showToast(`Route "${routeName}" created!`, 'success');
        this.showDMS();
    }
    
    deleteRoute(depotId, routeId) {
        const depot = this.state.depots.find(d => d.id === depotId);
        if (!depot) return;
        
        if (!confirm('Delete this route? Drivers will be unassigned.')) return;
        
        // Unassign drivers from this route
        this.state.drivers.forEach(driver => {
            if (driver.assignedRoute === routeId) {
                driver.assignedRoute = null;
            }
        });
        
        depot.configuredRoutes = depot.configuredRoutes.filter(r => r.id !== routeId);
        this.showToast('Route deleted', 'info');
        this.showDMS();
    }
    
    editRoute(depotId, routeId) {
        const depot = this.state.depots.find(d => d.id === depotId);
        const route = depot?.configuredRoutes.find(r => r.id === routeId);
        if (!depot || !route) return;
        
        const modal = `
            <h2>Edit Route: ${route.name}</h2>
            <div class="route-edit-container">
                <h3>Assign Towns to Route</h3>
                <div class="town-checkboxes">
                    ${this.STARTING_TOWNS.map(town => `
                        <label class="town-checkbox">
                            <input type="checkbox" 
                                   value="${town.name}" 
                                   ${route.towns.includes(town.name) ? 'checked' : ''}
                                   onchange="game.toggleRouteTown('${depotId}', '${routeId}', '${town.name}')">
                            <span>${town.name}</span>
                        </label>
                    `).join('')}
                </div>
                <p class="route-tip">💡 <strong>Tip:</strong> Assign multiple towns to create multi-stop routes. Drivers on this route will pick up from all assigned towns.</p>
            </div>
            <div class="modal-actions">
                <button onclick="game.showDMS()" class="btn-primary">Done</button>
            </div>
        `;
        
        this.showModal(modal);
    }
    
    toggleRouteTown(depotId, routeId, townName) {
        const depot = this.state.depots.find(d => d.id === depotId);
        const route = depot?.configuredRoutes.find(r => r.id === routeId);
        if (!depot || !route) return;
        
        if (route.towns.includes(townName)) {
            route.towns = route.towns.filter(t => t !== townName);
            this.showToast(`${townName} removed from route`, 'info');
        } else {
            route.towns.push(townName);
            this.showToast(`${townName} added to route`, 'success');
        }
    }
    
    manageRouteDrivers(depotId, routeId) {
        const depot = this.state.depots.find(d => d.id === depotId);
        const route = depot?.configuredRoutes.find(r => r.id === routeId);
        if (!depot || !route) return;
        
        const depotDrivers = this.state.drivers.filter(d => d.depotId === depotId);
        const assignedDrivers = depotDrivers.filter(d => d.assignedRoute === routeId);
        const availableDrivers = depotDrivers.filter(d => !d.assignedRoute || d.assignedRoute === routeId);
        
        const modal = `
            <h2>Manage Drivers: ${route.name}</h2>
            <div class="driver-assignment-container">
                <div class="route-info-box">
                    <p><strong>Route Towns:</strong> ${route.towns.length > 0 ? route.towns.join(', ') : 'No towns assigned'}</p>
                    <p><strong>Assigned Drivers:</strong> ${assignedDrivers.length}</p>
                </div>
                
                <h3>Assign Drivers to Route</h3>
                <div class="driver-assignment-list">
                    ${availableDrivers.map(driver => {
                        const vehicle = this.state.vehicles.find(v => v.id === driver.assignedVehicle);
                        const isAssigned = driver.assignedRoute === routeId;
                        return `
                            <label class="driver-assignment-item ${isAssigned ? 'assigned' : ''}">
                                <input type="checkbox" 
                                       ${isAssigned ? 'checked' : ''}
                                       ${!driver.assignedVehicle ? 'disabled' : ''}
                                       onchange="game.toggleDriverRoute('${routeId}', '${driver.id}')">
                                <div class="driver-assignment-info">
                                    <strong>${driver.name}</strong>
                                    <br><small>Vehicle: ${vehicle?.name || 'None assigned'}</small>
                                    ${!driver.assignedVehicle ? '<br><small class="warning">⚠️ No vehicle</small>' : ''}
                                </div>
                            </label>
                        `;
                    }).join('')}
                    ${availableDrivers.length === 0 ? '<p class="no-items">All drivers are assigned to other routes</p>' : ''}
                </div>
                <p class="route-tip">💡 <strong>Tip:</strong> Assign multiple drivers to split workload in high-volume towns.</p>
            </div>
            <div class="modal-actions">
                <button onclick="game.showDMS()" class="btn-primary">Done</button>
            </div>
        `;
        
        this.showModal(modal);
    }
    
    toggleDriverRoute(routeId, driverId) {
        const driver = this.state.drivers.find(d => d.id === driverId);
        if (!driver) return;
        
        if (driver.assignedRoute === routeId) {
            driver.assignedRoute = null;
            this.showToast(`${driver.name} unassigned from route`, 'info');
        } else {
            driver.assignedRoute = routeId;
            this.showToast(`${driver.name} assigned to route`, 'success');
        }
    }
    
    showDepotPurchaseModal() {
        const modal = `
            <h2>Purchase Depot</h2>
            <p>Cost: $${this.DEPOT_COST.toLocaleString()}</p>
            <p>Select a location for your depot:</p>
            <select id="depot-location">
                ${this.STARTING_TOWNS.map(town => `
                    <option value="${town.name}">${town.name}</option>
                `).join('')}
            </select>
            <div class="modal-actions">
                <button onclick="game.purchaseDepot()" class="btn-primary">Purchase</button>
                <button onclick="game.closeModal()" class="btn-secondary">Cancel</button>
            </div>
        `;
        this.showModal(modal);
    }
    
    purchaseDepot() {
        if (this.state.cash < this.DEPOT_COST) {
            this.showToast('Insufficient funds!', 'error');
            return;
        }
        
        const locationName = document.getElementById('depot-location').value;
        const location = this.STARTING_TOWNS.find(t => t.name === locationName);
        
        const depot = {
            id: `DEPOT${Date.now()}`,
            location: { lat: location.lat, lon: location.lon, name: location.name },
            capacity: 100,
            currentLoad: 0,
            configuredRoutes: [] // DMS route configurations
        };
        
        this.state.depots.push(depot);
        this.state.cash -= this.DEPOT_COST;
        
        // Add marker to map
        const marker = L.marker([location.lat, location.lon], {
            icon: L.divIcon({ className: 'depot-icon', html: '🏢', iconSize: [30, 30] })
        }).addTo(this.map);
        marker.bindPopup(`<b>Depot</b><br>${location.name}`);
        this.markers.push(marker);
        
        this.closeModal();
        this.showToast(`Depot established in ${location.name}!`, 'success');
        this.updateUI();
    }
    
    showVehiclePurchaseModal() {
        if (this.state.depots.length === 0) {
            this.showToast('You need a depot first!', 'error');
            return;
        }
        
        const modal = `
            <h2>Purchase Vehicle</h2>
            <div class="vehicle-options">
                ${Object.entries(this.VEHICLE_TYPES).map(([type, data]) => `
                    <div class="vehicle-option">
                        <h3>${data.name}</h3>
                        <p>Cost: $${data.cost.toLocaleString()}</p>
                        <p>Capacity: ${data.capacity} packages</p>
                        <p>Speed: ${data.speed} mph</p>
                        <p>Fuel: $${data.fuelCost}/mile</p>
                        <button onclick="game.purchaseVehicle('${type}')" class="btn-primary">Buy</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="game.closeModal()" class="btn-secondary">Cancel</button>
        `;
        this.showModal(modal);
    }
    
    purchaseVehicle(type) {
        const vehicleData = this.VEHICLE_TYPES[type];
        
        if (this.state.cash < vehicleData.cost) {
            this.showToast('Insufficient funds!', 'error');
            return;
        }
        
        const depot = this.state.depots[0]; // Assign to first depot
        
        const vehicle = {
            id: `VEH${Date.now()}`,
            type: type,
            name: `${vehicleData.name} #${this.state.vehicles.length + 1}`,
            depotId: depot?.id || null,
            driver: null,
            status: 'available',
            mileage: 0,
            condition: 100
        };
        
        this.state.vehicles.push(vehicle);
        this.state.cash -= vehicleData.cost;
        
        this.closeModal();
        this.showToast(`Purchased ${vehicleData.name}!`, 'success');
        this.updateUI();
    }
    
    showDriverHireModal() {
        const modal = `
            <h2>Hire Driver</h2>
            <p>Daily wage: $${this.DRIVER_WAGE}</p>
            <p>Drivers operate your vehicles and make deliveries.</p>
            <div class="driver-info">
                <p><strong>Experience Level:</strong> Entry</p>
                <p><strong>Reliability:</strong> ${Math.floor(Math.random() * 20) + 80}%</p>
            </div>
            <div class="modal-actions">
                <button onclick="game.hireDriver()" class="btn-primary">Hire</button>
                <button onclick="game.closeModal()" class="btn-secondary">Cancel</button>
            </div>
        `;
        this.showModal(modal);
    }
    
    hireDriver() {
        const driver = {
            id: `DRV${Date.now()}`,
            name: `Driver ${this.state.drivers.length + 1}`,
            experience: 1,
            reliability: Math.floor(Math.random() * 20) + 80,
            assignedVehicle: null,
            assignedRoute: null, // DMS route assignment
            depotId: this.state.depots[0]?.id || null, // Home depot
            status: 'available'
        };
        
        this.state.drivers.push(driver);
        
        // Auto-assign to available vehicle
        const availableVehicle = this.state.vehicles.find(v => !v.driver);
        if (availableVehicle) {
            availableVehicle.driver = driver.id;
            driver.assignedVehicle = availableVehicle.id;
            driver.status = 'assigned';
        }
        
        this.closeModal();
        this.showToast(`Hired ${driver.name}!`, 'success');
        this.updateUI();
    }
    
    showTownDispatch(town) {
        this.selectedTown = town;
        
        // Get depot for this town
        const depot = this.state.depots[0]; // For now, single depot
        if (!depot) {
            this.showToast('No depot available', 'error');
            return;
        }
        
        // Get routes that service this town
        const townRoutes = depot.configuredRoutes.filter(r => r.towns.includes(town.name));
        
        // Get all pending packages across all towns
        const allPickups = {};
        this.STARTING_TOWNS.forEach(t => {
            const pkgs = this.state.packages.filter(p => 
                p.origin.name === t.name && p.status === 'pending'
            );
            if (pkgs.length > 0) {
                allPickups[t.name] = pkgs;
            }
        });
        
        // Get packages for this specific town
        const townPickups = allPickups[town.name] || [];
        
        // Get packages being delivered today (picked up yesterday)
        const deliveriesToday = this.state.packages.filter(p => 
            p.status === 'in-transit' && p.pickupDay && p.pickupDay < this.state.day
        );
        
        // Get active pickup routes for today
        const activeRoutes = this.state.routes.filter(r => 
            r.status === 'active' && r.day === this.state.day && r.towns.includes(town.name)
        );
        
        const modal = `
            <h2>📍 ${town.name} - Dispatch Center</h2>
            <div class="workflow-info">
                <p><strong>📋 Workflow:</strong> Deliveries first (from yesterday's pickups) → Then new pickups</p>
                <p><strong>⏰ Timeline:</strong> Packages picked up today will be delivered tomorrow</p>
            </div>
            
            <div class="dispatch-section">
                <h3>🚚 Deliveries Today (${deliveriesToday.length})</h3>
                <p class="section-note">Packages picked up yesterday, being delivered now</p>
                <div class="package-dispatch-list">
                    ${deliveriesToday.length > 0 ? deliveriesToday.map(pkg => `
                        <div class="dispatch-package delivering">
                            <span class="pkg-id">${pkg.id}</span>
                            <span class="pkg-route">${pkg.origin.name} → ${pkg.destination.name}</span>
                            <span class="pkg-weight">${pkg.weight}lbs</span>
                        </div>
                    `).join('') : '<p class="no-items">No deliveries scheduled</p>'}
                </div>
            </div>
            
            <div class="dispatch-section">
                <h3>📦 Available for Pickup</h3>
                ${Object.entries(allPickups).map(([townName, pkgs]) => `
                    <div class="town-pickups">
                        <h4>${townName} (${pkgs.length} packages)</h4>
                        <div class="package-dispatch-list compact">
                            ${pkgs.slice(0, 5).map(pkg => `
                                <div class="dispatch-package small">
                                    <span class="pkg-dest">→ ${pkg.destination.name}</span>
                                    <span class="pkg-weight">${pkg.weight}lbs</span>
                                </div>
                            `).join('')}
                            ${pkgs.length > 5 ? `<p class="more-items">...and ${pkgs.length - 5} more</p>` : ''}
                        </div>
                    </div>
                `).join('')}
                ${Object.keys(allPickups).length === 0 ? '<p class="no-items">No packages waiting for pickup</p>' : ''}
            </div>
            
            <div class="dispatch-section">
                <h3>📋 Routes Serving ${town.name}</h3>
                ${townRoutes.length > 0 ? townRoutes.map(route => {
                    const routeDrivers = this.state.drivers.filter(d => d.assignedRoute === route.id);
                    const activeDrivers = activeRoutes.filter(r => r.configuredRouteId === route.id);
                    return `
                        <div class="town-route-card">
                            <h4>${route.name}</h4>
                            <p><strong>Towns:</strong> ${route.towns.join(', ')}</p>
                            <p><strong>Drivers:</strong> ${routeDrivers.length} assigned</p>
                            <p><strong>Active today:</strong> ${activeDrivers.length} out on pickup</p>
                        </div>
                    `;
                }).join('') : `
                    <p class="no-items">⚠️ No routes configured for ${town.name}.<br>
                    <button onclick="game.showDMS()" class="btn-primary" style="margin-top:10px;">Open DMS to Create Routes</button></p>
                `}
            </div>
            
            <div class="dispatch-section">
                <h3>🚛 Active Pickup Routes Today (${activeRoutes.length})</h3>
                <div class="route-dispatch-list">
                    ${activeRoutes.length > 0 ? activeRoutes.map(route => {
                        const driver = this.state.drivers.find(d => d.id === route.driverId);
                        const vehicle = this.state.vehicles.find(v => v.id === route.vehicleId);
                        const configRoute = depot.configuredRoutes.find(r => r.id === route.configuredRouteId);
                        const routeInfo = route.estimatedHours ? `
                            <br>Stops: ${route.estimatedStops} | Miles: ${route.estimatedMiles.toFixed(1)} | Hours: ${route.estimatedHours.toFixed(1)}
                        ` : '';
                        return `
                            <div class="dispatch-route">
                                <strong>${configRoute?.name || 'Route'}</strong> - ${driver?.name || 'Unknown'} - ${vehicle?.name || 'Unknown'}
                                <br>Pickup from: ${route.towns.join(', ')}
                                <br>Packages loaded: ${route.packages.length}${routeInfo}
                            </div>
                        `;
                    }).join('') : '<p class="no-items">No active pickup routes</p>'}
                </div>
            </div>
            
            <div class="modal-actions">
                <button onclick="game.closeModal()" class="btn-primary">Close</button>
            </div>
        `;
        
        this.showModal(modal);
    }
    
    planRoute(driverId, startTown) {
        const driver = this.state.drivers.find(d => d.id === driverId);
        const vehicle = this.state.vehicles.find(v => v.id === driver?.assignedVehicle);
        
        if (!driver || !vehicle) {
            this.showToast('Driver or vehicle not found', 'error');
            return;
        }
        
        const vehicleType = this.VEHICLE_TYPES[vehicle.type];
        
        // Get all available towns for this driver
        const availableTowns = driver.serviceTowns.length > 0 
            ? this.STARTING_TOWNS.filter(t => driver.serviceTowns.includes(t.name))
            : this.STARTING_TOWNS;
        
        // Get pending packages from available towns
        const packagesByTown = {};
        availableTowns.forEach(town => {
            const pkgs = this.state.packages.filter(p => 
                p.origin.name === town.name && p.status === 'pending'
            );
            if (pkgs.length > 0) {
                packagesByTown[town.name] = pkgs;
            }
        });
        
        // Build route options
        const routeOptions = [];
        const townNames = Object.keys(packagesByTown);
        
        // Single town routes
        townNames.forEach(town => {
            const packages = packagesByTown[town];
            const estimate = this.estimateRoute([town], packagesByTown, vehicleType.capacity);
            routeOptions.push({
                towns: [town],
                ...estimate
            });
        });
        
        // Multi-town routes (2 towns)
        if (townNames.length > 1) {
            for (let i = 0; i < townNames.length; i++) {
                for (let j = i + 1; j < townNames.length; j++) {
                    const towns = [townNames[i], townNames[j]];
                    const estimate = this.estimateRoute(towns, packagesByTown, vehicleType.capacity);
                    if (estimate.hours <= this.MAX_HOURS_DOT) {
                        routeOptions.push({
                            towns: towns,
                            ...estimate
                        });
                    }
                }
            }
        }
        
        // Multi-town routes (3 towns)
        if (townNames.length > 2) {
            for (let i = 0; i < townNames.length; i++) {
                for (let j = i + 1; j < townNames.length; j++) {
                    for (let k = j + 1; k < townNames.length; k++) {
                        const towns = [townNames[i], townNames[j], townNames[k]];
                        const estimate = this.estimateRoute(towns, packagesByTown, vehicleType.capacity);
                        if (estimate.hours <= this.MAX_HOURS_DOT) {
                            routeOptions.push({
                                towns: towns,
                                ...estimate
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by efficiency (most packages per hour)
        routeOptions.sort((a, b) => (b.pickups / b.hours) - (a.pickups / a.hours));
        
        const modal = `
            <h2>🗺️ Plan Pickup Route for ${driver.name}</h2>
            <div class="route-planning">
                <p><strong>Vehicle:</strong> ${vehicle.name} (${vehicleType.capacity} package capacity)</p>
                <p><strong>Service Area:</strong> ${driver.serviceTowns.length > 0 ? driver.serviceTowns.join(', ') : 'All towns'}</p>
                <p class="multi-town-info">💡 <strong>Workflow:</strong> Pick up packages from selected towns today → Deliver them tomorrow</p>
                <hr>
                <h3>Route Options</h3>
                <div class="route-options-list">
                    ${routeOptions.map((option, index) => {
                        const isOvertime = option.hours > this.OVERTIME_THRESHOLD;
                        const isDOTWarning = option.hours > this.MAX_HOURS_DOT * 0.9;
                        const isDOTViolation = option.hours > this.MAX_HOURS_DOT;
                        
                        return `
                            <div class="route-option ${isDOTViolation ? 'violation' : ''}">
                                <div class="route-option-header">
                                    <strong>Route ${index + 1}: ${option.towns.join(' → ')}</strong>
                                    ${isOvertime ? '<span class="overtime-badge">⏰ OT</span>' : ''}
                                    ${isDOTWarning ? '<span class="dot-warning">⚠️ Near Limit</span>' : ''}
                                    ${isDOTViolation ? '<span class="dot-violation">🚫 DOT Violation</span>' : ''}
                                </div>
                                <div class="route-towns-detail">
                                    <small>📍 Pickup from: ${option.towns.join(', ')}</small>
                                </div>
                                <div class="route-estimate">
                                    <div class="estimate-item">
                                        <span class="estimate-label">📦 Pickups:</span>
                                        <span class="estimate-value">${option.pickups}</span>
                                    </div>
                                    <div class="estimate-item">
                                        <span class="estimate-label">📍 Deliveries:</span>
                                        <span class="estimate-value">${option.deliveries}</span>
                                    </div>
                                    <div class="estimate-item">
                                        <span class="estimate-label">🛣️ Miles:</span>
                                        <span class="estimate-value">${option.miles.toFixed(1)}</span>
                                    </div>
                                    <div class="estimate-item">
                                        <span class="estimate-label">⏱️ Hours:</span>
                                        <span class="estimate-value ${isOvertime ? 'overtime' : ''}">${option.hours.toFixed(1)}</span>
                                    </div>
                                    <div class="estimate-item">
                                        <span class="estimate-label">💰 Est. Revenue:</span>
                                        <span class="estimate-value">$${option.revenue}</span>
                                    </div>
                                    <div class="estimate-item">
                                        <span class="estimate-label">⛽ Fuel Cost:</span>
                                        <span class="estimate-value">$${option.fuelCost.toFixed(2)}</span>
                                    </div>
                                </div>
                                ${!isDOTViolation ? `
                                    <button onclick="game.executeRoute('${driver.id}', ${JSON.stringify(option.towns).replace(/"/g, '&quot;')})" class="btn-dispatch">Dispatch This Route</button>
                                ` : '<p class="violation-text">Cannot dispatch - exceeds DOT 14-hour limit</p>'}
                            </div>
                        `;
                    }).join('')}
                </div>
                ${routeOptions.length === 0 ? '<p class="no-items">No available routes</p>' : ''}
            </div>
            <div class="modal-actions">
                <button onclick="game.closeModal()" class="btn-secondary">Cancel</button>
            </div>
        `;
        
        this.showModal(modal);
    }
    
    estimateRoute(towns, packagesByTown, vehicleCapacity) {
        // Get packages from these towns
        let allPackages = [];
        towns.forEach(town => {
            if (packagesByTown[town]) {
                allPackages = allPackages.concat(packagesByTown[town]);
            }
        });
        
        // Limit by vehicle capacity
        const packagesToLoad = allPackages.slice(0, vehicleCapacity);
        const pickups = packagesToLoad.length;
        
        // Count unique delivery locations
        const deliveryTowns = new Set(packagesToLoad.map(p => p.destination.name));
        const deliveries = deliveryTowns.size;
        
        // Calculate total miles (approximate circuit through towns)
        let totalMiles = 0;
        if (towns.length === 1) {
            // Single town - just local deliveries
            const townLoc = this.STARTING_TOWNS.find(t => t.name === towns[0]);
            // Average local delivery distance
            totalMiles = pickups * 5; // assume 5 miles per package locally
        } else {
            // Multi-town route
            for (let i = 0; i < towns.length; i++) {
                const fromTown = this.STARTING_TOWNS.find(t => t.name === towns[i]);
                const toTown = this.STARTING_TOWNS.find(t => t.name === towns[(i + 1) % towns.length]);
                if (fromTown && toTown) {
                    totalMiles += this.calculateDistance(
                        { lat: fromTown.lat, lon: fromTown.lon },
                        { lat: toTown.lat, lon: toTown.lon }
                    );
                }
            }
            // Add delivery miles
            totalMiles += pickups * 3; // average delivery distance per package
        }
        
        // Calculate hours
        const totalStops = pickups + deliveryTowns.size;
        const stopHours = totalStops / this.STOPS_PER_HOUR;
        const driveHours = totalMiles / 45; // average 45 mph
        const totalHours = stopHours + driveHours;
        
        // Calculate revenue and costs
        const revenue = pickups * this.BASE_DELIVERY_RATE;
        const fuelCost = totalMiles * 0.20; // average fuel cost
        
        return {
            pickups,
            deliveries,
            miles: totalMiles,
            hours: totalHours,
            stops: totalStops,
            revenue,
            fuelCost
        };
    }
    
    executeRoute(driverId, towns) {
        const driver = this.state.drivers.find(d => d.id === driverId);
        const vehicle = this.state.vehicles.find(v => v.id === driver?.assignedVehicle);
        
        if (!driver || !vehicle) {
            this.showToast('Driver or vehicle not found', 'error');
            return;
        }
        
        const vehicleType = this.VEHICLE_TYPES[vehicle.type];
        
        // Collect packages from all towns
        let packagesToLoad = [];
        towns.forEach(town => {
            const pkgs = this.state.packages.filter(p => 
                p.origin.name === town && p.status === 'pending'
            );
            packagesToLoad = packagesToLoad.concat(pkgs);
        });
        
        // Limit by capacity
        packagesToLoad = packagesToLoad.slice(0, vehicleType.capacity);
        
        if (packagesToLoad.length === 0) {
            this.showToast('No packages to load', 'warning');
            return;
        }
        
        // Calculate route details
        const packagesByTown = {};
        towns.forEach(town => {
            packagesByTown[town] = this.state.packages.filter(p => 
                p.origin.name === town && p.status === 'pending'
            );
        });
        const estimate = this.estimateRoute(towns, packagesByTown, vehicleType.capacity);
        
        // Create route
        const route = {
            id: `ROUTE${Date.now()}`,
            driverId: driver.id,
            vehicleId: vehicle.id,
            towns: towns,
            packages: packagesToLoad.map(p => p.id),
            status: 'active',
            day: this.state.day,
            estimatedMiles: estimate.miles,
            estimatedHours: estimate.hours,
            estimatedStops: estimate.stops
        };
        
        this.state.routes.push(route);
        
        // Update package status and calculate costs
        packagesToLoad.forEach(pkg => {
            pkg.status = 'in-transit';
            pkg.assignedRoute = route.id;
            pkg.pickupDay = this.state.day; // Mark when picked up
            
            const distance = this.calculateDistance(pkg.origin, pkg.destination);
            this.state.finances.expenses.fuel += distance * vehicleType.fuelCost;
        });
        
        this.closeModal();
        this.showToast(`Pickup route dispatched! ${packagesToLoad.length} packages picked up from ${towns.join(', ')}`, 'success');
        this.updateUI();
    }
    
    dispatchRoute(driverId, townName) {
        const driver = this.state.drivers.find(d => d.id === driverId);
        const vehicle = this.state.vehicles.find(v => v.id === driver?.assignedVehicle);
        
        if (!driver || !vehicle) {
            this.showToast('Driver or vehicle not found', 'error');
            return;
        }
        
        const vehicleType = this.VEHICLE_TYPES[vehicle.type];
        const pickups = this.state.packages.filter(p => 
            p.origin.name === townName && p.status === 'pending'
        );
        
        if (pickups.length === 0) {
            this.showToast('No packages to pick up', 'warning');
            return;
        }
        
        const packagesToLoad = pickups.slice(0, vehicleType.capacity);
        
        // Create route
        const route = {
            id: `ROUTE${Date.now()}`,
            driverId: driver.id,
            vehicleId: vehicle.id,
            town: townName,
            packages: packagesToLoad.map(p => p.id),
            status: 'active',
            day: this.state.day
        };
        
        this.state.routes.push(route);
        
        // Update package status and calculate costs
        packagesToLoad.forEach(pkg => {
            pkg.status = 'in-transit';
            pkg.assignedRoute = route.id;
            
            const distance = this.calculateDistance(pkg.origin, pkg.destination);
            this.state.finances.expenses.fuel += distance * vehicleType.fuelCost;
        });
        
        this.showToast(`Route dispatched! ${packagesToLoad.length} packages loaded`, 'success');
        this.updateUI();
        
        // Refresh the modal
        const town = this.STARTING_TOWNS.find(t => t.name === townName);
        if (town) this.showTownDispatch(town);
    }
    
    showLoanModal() {
        const modal = `
            <h2>Take Out Loan</h2>
            <p>Interest rate: ${(this.LOAN_INTEREST_RATE * 100).toFixed(1)}% daily</p>
            <p>Current loan: $${this.state.loan.toLocaleString()}</p>
            <label>Loan amount:</label>
            <input type="number" id="loan-amount-input" value="10000" step="1000" min="1000" max="100000">
            <div class="modal-actions">
                <button onclick="game.takeLoan()" class="btn-primary">Take Loan</button>
                <button onclick="game.closeModal()" class="btn-secondary">Cancel</button>
            </div>
        `;
        this.showModal(modal);
    }
    
    takeLoan() {
        const amount = parseInt(document.getElementById('loan-amount-input').value);
        this.state.loan += amount;
        this.state.cash += amount;
        
        this.closeModal();
        this.showToast(`Loan of $${amount.toLocaleString()} approved!`, 'success');
        this.updateUI();
    }
    
    repayLoan() {
        if (this.state.loan === 0) {
            this.showToast('No outstanding loan!', 'info');
            return;
        }
        
        const repayAmount = Math.min(this.state.cash, this.state.loan);
        if (repayAmount === 0) {
            this.showToast('Insufficient cash!', 'error');
            return;
        }
        
        this.state.cash -= repayAmount;
        this.state.loan -= repayAmount;
        
        this.showToast(`Repaid $${repayAmount.toLocaleString()}!`, 'success');
        this.updateUI();
    }
    
    renderPackages() {
        const filter = document.querySelector('.filter-btn.active').dataset.filter;
        const packagesList = document.getElementById('packages-list');
        
        let packages = this.state.packages;
        if (filter !== 'all') {
            packages = packages.filter(p => {
                if (filter === 'pending') return p.status === 'pending';
                if (filter === 'in-transit') return p.status === 'in-transit';
                if (filter === 'delivered') return p.status === 'delivered';
            });
        }
        
        packagesList.innerHTML = packages.map(pkg => `
            <div class="package-item ${pkg.status}">
                <div class="package-id">${pkg.id}</div>
                <div class="package-route">
                    ${pkg.origin.name} → ${pkg.destination.name}
                </div>
                <div class="package-details">
                    Weight: ${pkg.weight}lbs | Status: ${pkg.status}
                    ${pkg.deliveryDay ? ` | Delivered: Day ${pkg.deliveryDay}` : ''}
                </div>
            </div>
        `).join('');
    }
    
    renderVehicles() {
        const vehiclesList = document.getElementById('vehicles-list');
        
        vehiclesList.innerHTML = this.state.vehicles.map(vehicle => {
            const vehicleData = this.VEHICLE_TYPES[vehicle.type];
            const driver = this.state.drivers.find(d => d.id === vehicle.driver);
            
            return `
                <div class="vehicle-item">
                    <h3>🚚 ${vehicle.name}</h3>
                    <p>Type: ${vehicleData.name}</p>
                    <p>Capacity: ${vehicleData.capacity} packages</p>
                    <p>Driver: ${driver ? driver.name : 'Unassigned'}</p>
                    <p>Status: ${vehicle.status}</p>
                    <p>Condition: ${vehicle.condition}%</p>
                    <div class="condition-bar">
                        <div class="condition-fill" style="width: ${vehicle.condition}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderDrivers() {
        const driversList = document.getElementById('drivers-list');
        
        driversList.innerHTML = this.state.drivers.map(driver => {
            const vehicle = this.state.vehicles.find(v => v.id === driver.assignedVehicle);
            const activeRoute = this.state.routes.find(r => r.driverId === driver.id && r.status === 'active');
            const depot = this.state.depots.find(d => d.id === driver.depotId);
            const configRoute = depot?.configuredRoutes.find(r => r.id === driver.assignedRoute);
            
            return `
                <div class="driver-item">
                    <h3>👤 ${driver.name}</h3>
                    <p>Experience: Level ${driver.experience}</p>
                    <p>Reliability: ${driver.reliability}%</p>
                    <p>Vehicle: ${vehicle ? vehicle.name : 'Unassigned'}</p>
                    <p>Depot: ${depot?.location.name || 'None'}</p>
                    <p>Route: ${configRoute ? `${configRoute.name} (${configRoute.towns.join(', ')})` : 'Unassigned'}</p>
                    <p>Status: ${activeRoute ? '🚛 On Route' : '✅ Available'}</p>
                </div>
            `;
        }).join('');
    }
    
    renderRoutes() {
        const routesList = document.getElementById('routes-list');
        
        const activeRoutes = this.state.routes.filter(r => r.status === 'active');
        const todayRoutes = this.state.routes.filter(r => r.day === this.state.day);
        
        let html = `
            <div class="routes-summary">
                <h3>Today's Routes Summary</h3>
                <p>Active routes: ${activeRoutes.length}</p>
                <p>Total routes today: ${todayRoutes.length}</p>
            </div>
        `;
        
        if (todayRoutes.length === 0) {
            html += '<p class="no-items">No routes dispatched yet. Click on towns on the map to dispatch routes.</p>';
        } else {
            html += todayRoutes.map(route => {
                const driver = this.state.drivers.find(d => d.id === route.driverId);
                const vehicle = this.state.vehicles.find(v => v.id === route.vehicleId);
                const packages = route.packages.map(id => this.state.packages.find(p => p.id === id)).filter(p => p);
                
                return `
                    <div class="route-item ${route.status}">
                        <h4>🚛 Route: ${route.towns ? route.towns.join(' → ') : route.town}</h4>
                        <p><strong>Driver:</strong> ${driver?.name || 'Unknown'}</p>
                        <p><strong>Vehicle:</strong> ${vehicle?.name || 'Unknown'}</p>
                        <p><strong>Packages:</strong> ${packages.length}</p>
                        ${route.estimatedHours ? `<p><strong>Est. Hours:</strong> ${route.estimatedHours.toFixed(1)} | <strong>Miles:</strong> ${route.estimatedMiles.toFixed(1)}</p>` : ''}
                        <p><strong>Status:</strong> ${route.status}</p>
                        <div class="route-packages">
                            ${packages.map(pkg => `
                                <div class="route-package-item">
                                    ${pkg.origin.name} → ${pkg.destination.name} (${pkg.weight}lbs)
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        routesList.innerHTML = html;
    }
    
    renderFacilities() {
        const facilitiesList = document.getElementById('facilities-list');
        
        let html = '<h3>Depots</h3>';
        html += this.state.depots.map(depot => `
            <div class="facility-item">
                <h4>🏢 ${depot.location.name}</h4>
                <p>Capacity: ${depot.capacity} packages</p>
                <p>Current load: ${depot.currentLoad}</p>
            </div>
        `).join('');
        
        if (this.state.hubs.length > 0) {
            html += '<h3>Hubs</h3>';
            html += this.state.hubs.map(hub => `
                <div class="facility-item">
                    <h4>🏭 ${hub.location.name}</h4>
                    <p>Capacity: ${hub.capacity} packages</p>
                    <p>Current load: ${hub.currentLoad}</p>
                </div>
            `).join('');
        }
        
        facilitiesList.innerHTML = html;
    }
    
    renderFinances() {
        document.getElementById('revenue-deliveries').textContent = this.state.finances.revenue.deliveries.toLocaleString();
        document.getElementById('revenue-express').textContent = this.state.finances.revenue.express.toLocaleString();
        document.getElementById('revenue-total').textContent = 
            (this.state.finances.revenue.deliveries + this.state.finances.revenue.express).toLocaleString();
        
        document.getElementById('expense-wages').textContent = this.state.finances.expenses.wages.toLocaleString();
        document.getElementById('expense-fuel').textContent = Math.floor(this.state.finances.expenses.fuel).toLocaleString();
        document.getElementById('expense-maintenance').textContent = this.state.finances.expenses.maintenance.toLocaleString();
        document.getElementById('expense-facilities').textContent = this.state.finances.expenses.facilities.toLocaleString();
        document.getElementById('expense-interest').textContent = this.state.finances.expenses.interest.toLocaleString();
        document.getElementById('expense-total').textContent = 
            Math.floor(Object.values(this.state.finances.expenses).reduce((a, b) => a + b, 0)).toLocaleString();
        
        document.getElementById('loan-amount').textContent = this.state.loan.toLocaleString();
        document.getElementById('loan-interest').textContent = Math.floor(this.state.loan * this.LOAN_INTEREST_RATE).toLocaleString();
    }
    
    filterPackages(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderPackages();
    }
    
    updateUI() {
        // Update header stats
        document.getElementById('day-counter').textContent = this.state.day;
        document.getElementById('cash-display').textContent = `$${this.state.cash.toLocaleString()}`;
        document.getElementById('loan-display').textContent = `$${this.state.loan.toLocaleString()}`;
        
        const totalRevenue = this.state.finances.revenue.deliveries + this.state.finances.revenue.express;
        const totalExpenses = Object.values(this.state.finances.expenses).reduce((a, b) => a + b, 0);
        const profit = totalRevenue - totalExpenses;
        document.getElementById('profit-display').textContent = `$${profit.toLocaleString()}`;
        document.getElementById('profit-display').className = profit >= 0 ? 'positive' : 'negative';
        
        document.getElementById('reputation-display').textContent = `${this.state.reputation}%`;
        
        // Update overview
        document.getElementById('packages-transit').textContent = 
            this.state.packages.filter(p => p.status === 'in-transit').length;
        document.getElementById('packages-delivered').textContent = 
            this.state.packages.filter(p => p.status === 'delivered').length;
        document.getElementById('active-vehicles').textContent = this.state.vehicles.length;
        document.getElementById('active-drivers').textContent = this.state.drivers.length;
    }
    
    calculateDistance(point1, point2) {
        // Haversine formula for distance between two lat/lon points
        const R = 3959; // Earth's radius in miles
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lon - point1.lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    findNearestDepot(location) {
        if (this.state.depots.length === 0) return null;
        
        let nearest = this.state.depots[0];
        let minDistance = this.calculateDistance(location, nearest.location);
        
        for (let i = 1; i < this.state.depots.length; i++) {
            const distance = this.calculateDistance(location, this.state.depots[i].location);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = this.state.depots[i];
            }
        }
        
        return nearest;
    }
    
    showModal(content) {
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }
    
    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    showWelcomeModal() {
        const modal = `
            <h2>Welcome to Parcel Logistics Tycoon!</h2>
            <p>You've received a loan of $50,000 to start your logistics empire.</p>
            <h3>Getting Started:</h3>
            <ol>
                <li>Purchase a depot in one of the starting towns</li>
                <li>Buy delivery vehicles</li>
                <li>Hire drivers</li>
                <li>Deliver packages to earn money!</li>
            </ol>
            <p><strong>Tips:</strong></p>
            <ul>
                <li>On-time deliveries earn bonus revenue and improve reputation</li>
                <li>Driver miles cost money in fuel</li>
                <li>Manage your cash flow - don't let it go negative!</li>
                <li>Repay your loan to reduce daily interest costs</li>
            </ul>
            <button onclick="game.closeModal()" class="btn-primary">Start Playing!</button>
        `;
        this.showModal(modal);
    }
    
    saveGame() {
        const saveData = JSON.stringify(this.state);
        
        fetch('save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', data: saveData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showToast('Game saved!', 'success');
            } else {
                this.showToast('Save failed!', 'error');
            }
        })
        .catch(() => {
            // Fallback to localStorage
            localStorage.setItem('logisticsGameSave', saveData);
            this.showToast('Game saved locally!', 'success');
        });
    }
    
    loadGame() {
        fetch('save.php?action=load')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                this.state = JSON.parse(data.data);
                this.updateUI();
                this.showToast('Game loaded!', 'success');
            } else {
                throw new Error('No save found');
            }
        })
        .catch(() => {
            // Fallback to localStorage
            const saveData = localStorage.getItem('logisticsGameSave');
            if (saveData) {
                this.state = JSON.parse(saveData);
                this.updateUI();
                this.showToast('Game loaded from local storage!', 'success');
            } else {
                this.showToast('No saved game found!', 'error');
            }
        });
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new LogisticsGame();
});
