// Aplicación FacturaFlow - Sistema Administrativo Simplificado
document.addEventListener('DOMContentLoaded', function() {
    // Estado de la aplicación
    const appState = {
        currentUser: null,
        currentView: 'dashboard',
        userRole: null,
        clients: [],
        suppliers: [],
        invoices: [],
        budgets: [],
        commercialInvoices: []
    };
    
    // Referencias a elementos del DOM
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const authTabs = document.querySelectorAll('.auth-tab');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    // Inicialización de la aplicación
    function initApp() {
        setupEventListeners();
        checkAuthState();
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        // Autenticación
        loginForm.addEventListener('submit', handleLogin);
        registerForm.addEventListener('submit', handleRegister);
        logoutBtn.addEventListener('click', handleLogout);
        
        // Tabs de autenticación
        authTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchAuthTab(tabId);
            });
        });
        
        // Navegación
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.getAttribute('data-view');
                switchView(view);
                
                // Cerrar menú móvil si está abierto
                mobileMenu.classList.add('hidden');
            });
        });
        
        // Menú móvil
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Cambio de rol en registro
        document.getElementById('register-role').addEventListener('change', function() {
            const accountantFields = document.getElementById('accountant-fields');
            if (this.value === 'accountant') {
                accountantFields.classList.remove('hidden');
            } else {
                accountantFields.classList.add('hidden');
            }
        });
        
        // Botones de acción
        setupActionButtons();
        
        // Modales
        setupModals();
    }
    
    // Configurar botones de acción
    function setupActionButtons() {
        // Clientes
        document.getElementById('add-client-btn')?.addEventListener('click', () => openClientModal());
        
        // Proveedores
        document.getElementById('add-supplier-btn')?.addEventListener('click', () => openSupplierModal());
        
        // Facturas
        document.getElementById('add-invoice-btn')?.addEventListener('click', () => openInvoiceModal());
        document.getElementById('quick-add-invoice')?.addEventListener('click', () => openInvoiceModal());
        
        // Presupuestos
        document.getElementById('add-budget-btn')?.addEventListener('click', () => openBudgetModal());
        
        // Facturas comerciales
        document.getElementById('add-commercial-invoice-btn')?.addEventListener('click', () => openCommercialInvoiceModal());
    }
    
    // Configurar modales
    function setupModals() {
        // Cerrar modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').classList.add('hidden');
            });
        });
        
        // Cerrar modal al hacer clic fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.add('hidden');
                }
            });
        });
        
        // Formularios de modales
        document.getElementById('client-form')?.addEventListener('submit', saveClient);
        document.getElementById('invoice-form')?.addEventListener('submit', saveInvoice);
        document.getElementById('budget-form')?.addEventListener('submit', saveBudget);
        
        // Upload de archivos
        document.getElementById('invoice-upload-area')?.addEventListener('click', function() {
            document.getElementById('invoice-file').click();
        });
        
        document.getElementById('invoice-file')?.addEventListener('change', handleFileUpload);
        
        // Arrastrar y soltar archivos
        const uploadArea = document.getElementById('invoice-upload-area');
        uploadArea?.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea?.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        uploadArea?.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload({ target: { files } });
            }
        });
        
        // Agregar ítems a presupuestos
        document.getElementById('add-budget-item')?.addEventListener('click', addBudgetItem);
        
        // Calcular total de presupuesto
        document.getElementById('budget-items')?.addEventListener('input', calculateBudgetTotal);
        
        // Botón de imprimir
        document.getElementById('print-btn')?.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Manejar estado de autenticación
    function checkAuthState() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // Usuario autenticado
                appState.currentUser = user;
                loadUserData(user.uid);
                showAppView();
            } else {
                // No autenticado
                showAuthView();
            }
        });
    }
    
    // Cargar datos del usuario
    function loadUserData(userId) {
        // Obtener información del usuario desde Firestore
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    appState.userRole = userData.role;
                    appState.currentUser.data = userData;
                    
                    // Actualizar interfaz con datos del usuario
                    updateUserInterface(userData);
                    
                    // Cargar datos según el rol
                    loadUserDataByRole();
                }
            })
            .catch(error => {
                console.error('Error al cargar datos del usuario:', error);
            });
    }
    
    // Cargar datos según el rol del usuario
    function loadUserDataByRole() {
        loadClients();
        loadSuppliers();
        loadInvoices();
        loadBudgets();
        loadCommercialInvoices();
        updateDashboardStats();
    }
    
    // Actualizar interfaz con datos del usuario
    function updateUserInterface(userData) {
        // Avatar del usuario
        const userAvatar = document.getElementById('user-avatar');
        if (userData.name) {
            userAvatar.textContent = userData.name.charAt(0).toUpperCase();
        }
        
        // Mostrar nombre en dashboard si está disponible
        const dashboardTitle = document.querySelector('#dashboard-view .view-title');
        if (dashboardTitle && userData.name) {
            dashboardTitle.textContent = `Dashboard - ${userData.name}`;
        }
    }
    
    // Manejar inicio de sesión
    function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;
        
        if (!email || !password || !role) {
            showError('login-error', 'Por favor completa todos los campos');
            return;
        }
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Verificar rol del usuario
                return db.collection('users').doc(userCredential.user.uid).get();
            })
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.role !== role) {
                        auth.signOut();
                        showError('login-error', 'El rol seleccionado no coincide con tu cuenta');
                    } else {
                        // Login exitoso
                        clearForm(loginForm);
                        showError('login-error', '');
                    }
                }
            })
            .catch(error => {
                console.error('Error en login:', error);
                showError('login-error', getAuthErrorMessage(error.code));
            });
    }
    
    // Manejar registro
    function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        const clients = document.getElementById('register-clients')?.value || '';
        
        if (!name || !email || !password || !role) {
            showError('register-error', 'Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (password.length < 6) {
            showError('register-error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Guardar información adicional del usuario en Firestore
                const userData = {
                    name,
                    email,
                    role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Si es contador, guardar clientes asignados
                if (role === 'accountant' && clients.trim()) {
                    userData.assignedClients = clients.split(',').map(email => email.trim());
                }
                
                return db.collection('users').doc(userCredential.user.uid).set(userData);
            })
            .then(() => {
                clearForm(registerForm);
                showError('register-error', '');
                switchAuthTab('login');
                alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
            })
            .catch(error => {
                console.error('Error en registro:', error);
                showError('register-error', getAuthErrorMessage(error.code));
            });
    }
    
    // Manejar cierre de sesión
    function handleLogout() {
        auth.signOut()
            .then(() => {
                appState.currentUser = null;
                appState.userRole = null;
                clearAppData();
                showAuthView();
            })
            .catch(error => {
                console.error('Error al cerrar sesión:', error);
            });
    }
    
    // Cambiar pestaña de autenticación
    function switchAuthTab(tabId) {
        // Actualizar tabs activos
        authTabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mostrar formulario correspondiente
        if (tabId === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }
    
    // Cambiar vista principal
    function switchView(viewId) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Mostrar vista seleccionada
        document.getElementById(`${viewId}-view`)?.classList.remove('hidden');
        
        // Actualizar navegación activa
        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === viewId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Actualizar estado
        appState.currentView = viewId;
        
        // Cargar datos específicos de la vista si es necesario
        if (viewId === 'accounts') {
            loadAccounts();
        }
    }
    
    // Mostrar vista de autenticación
    function showAuthView() {
        authView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
    
    // Mostrar vista de la aplicación
    function showAppView() {
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
    }
    
    // Cargar clientes
    function loadClients() {
        const clientsRef = db.collection('clients');
        let query = clientsRef;
        
        // Si es un negocio, solo ver sus clientes
        if (appState.userRole === 'business') {
            query = query.where('userId', '==', appState.currentUser.uid);
        }
        // Si es contador, ver clientes asignados
        else if (appState.userRole === 'accountant') {
            // Esto requiere una estructura más compleja - simplificamos por ahora
            query = query.where('accountantId', '==', appState.currentUser.uid);
        }
        
        query.get()
            .then(snapshot => {
                appState.clients = [];
                const tableBody = document.getElementById('clients-table-body');
                tableBody.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const client = { id: doc.id, ...doc.data() };
                    appState.clients.push(client);
                    
                    // Agregar fila a la tabla
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${client.name}</td>
                        <td>${client.email || '-'}</td>
                        <td>${client.phone || '-'}</td>
                        <td>${client.address ? client.address.substring(0, 30) + '...' : '-'}</td>
                        <td>
                            <button class="btn btn-primary edit-client" data-id="${client.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-client" data-id="${client.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                // Agregar event listeners a los botones
                document.querySelectorAll('.edit-client').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const clientId = this.getAttribute('data-id');
                        editClient(clientId);
                    });
                });
                
                document.querySelectorAll('.delete-client').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const clientId = this.getAttribute('data-id');
                        deleteClient(clientId);
                    });
                });
            })
            .catch(error => {
                console.error('Error al cargar clientes:', error);
            });
    }
    
    // Abrir modal de cliente
    function openClientModal(clientId = null) {
        const modal = document.getElementById('client-modal');
        const title = document.getElementById('client-modal-title');
        const form = document.getElementById('client-form');
        
        if (clientId) {
            // Modo edición
            title.textContent = 'Editar Cliente';
            const client = appState.clients.find(c => c.id === clientId);
            
            if (client) {
                document.getElementById('client-id').value = client.id;
                document.getElementById('client-name').value = client.name || '';
                document.getElementById('client-email').value = client.email || '';
                document.getElementById('client-phone').value = client.phone || '';
                document.getElementById('client-tax-id').value = client.taxId || '';
                document.getElementById('client-address').value = client.address || '';
                document.getElementById('client-notes').value = client.notes || '';
            }
        } else {
            // Modo creación
            title.textContent = 'Nuevo Cliente';
            form.reset();
            document.getElementById('client-id').value = '';
        }
        
        modal.classList.remove('hidden');
    }
    
    // Guardar cliente
    function saveClient(e) {
        e.preventDefault();
        
        const clientId = document.getElementById('client-id').value;
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            taxId: document.getElementById('client-tax-id').value,
            address: document.getElementById('client-address').value,
            notes: document.getElementById('client-notes').value,
            userId: appState.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!clientId) {
            // Nuevo cliente
            clientData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            db.collection('clients').add(clientData)
                .then(() => {
                    alert('Cliente creado exitosamente');
                    document.getElementById('client-modal').classList.add('hidden');
                    loadClients();
                    addActivity('Cliente creado', 'Se agregó un nuevo cliente');
                })
                .catch(error => {
                    console.error('Error al crear cliente:', error);
                    alert('Error al crear cliente');
                });
        } else {
            // Actualizar cliente existente
            db.collection('clients').doc(clientId).update(clientData)
                .then(() => {
                    alert('Cliente actualizado exitosamente');
                    document.getElementById('client-modal').classList.add('hidden');
                    loadClients();
                    addActivity('Cliente actualizado', 'Se modificó un cliente');
                })
                .catch(error => {
                    console.error('Error al actualizar cliente:', error);
                    alert('Error al actualizar cliente');
                });
        }
    }
    
    // Editar cliente
    function editClient(clientId) {
        openClientModal(clientId);
    }
    
    // Eliminar cliente
    function deleteClient(clientId) {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            db.collection('clients').doc(clientId).delete()
                .then(() => {
                    alert('Cliente eliminado exitosamente');
                    loadClients();
                    addActivity('Cliente eliminado', 'Se eliminó un cliente');
                })
                .catch(error => {
                    console.error('Error al eliminar cliente:', error);
                    alert('Error al eliminar cliente');
                });
        }
    }
    
    // Cargar proveedores
    function loadSuppliers() {
        // Similar a loadClients pero para proveedores
        // Implementación simplificada
    }
    
    // Abrir modal de proveedor
    function openSupplierModal() {
        // Similar a openClientModal pero para proveedores
        // Implementación simplificada
    }
    
    // Cargar facturas
    function loadInvoices() {
        const invoicesRef = db.collection('invoices');
        let query = invoicesRef.where('userId', '==', appState.currentUser.uid);
        
        query.get()
            .then(snapshot => {
                appState.invoices = [];
                const tableBody = document.getElementById('invoices-table-body');
                tableBody.innerHTML = '';
                
                snapshot.forEach(doc => {
                    const invoice = { id: doc.id, ...doc.data() };
                    appState.invoices.push(invoice);
                    
                    // Formatear fecha
                    const invoiceDate = invoice.date ? new Date(invoice.date.seconds * 1000).toLocaleDateString() : '-';
                    
                    // Determinar tipo
                    const typeText = invoice.type === 'received' ? 'Recibida' : 'Emitida';
                    
                    // Determinar estado
                    let statusClass, statusText;
                    switch (invoice.status) {
                        case 'pending':
                            statusClass = 'status-pending';
                            statusText = 'Pendiente';
                            break;
                        case 'paid':
                            statusClass = 'status-paid';
                            statusText = 'Pagada';
                            break;
                        case 'overdue':
                            statusClass = 'status-overdue';
                            statusText = 'Vencida';
                            break;
                        default:
                            statusClass = 'status-pending';
                            statusText = 'Pendiente';
                    }
                    
                    // Agregar fila a la tabla
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${typeText}</td>
                        <td>${invoice.number || '-'}</td>
                        <td>${invoice.entityName || '-'}</td>
                        <td>${invoiceDate}</td>
                        <td>$${parseFloat(invoice.amount || 0).toFixed(2)}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            ${invoice.fileUrl ? 
                                `<a href="${invoice.fileUrl}" target="_blank" class="btn btn-primary">
                                    <i class="fas fa-eye"></i>
                                </a>` : 
                                'Sin archivo'
                            }
                        </td>
                        <td>
                            <button class="btn btn-primary edit-invoice" data-id="${invoice.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger delete-invoice" data-id="${invoice.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
                
                // Agregar event listeners
                setupInvoiceEventListeners();
                
                // Actualizar estadísticas del dashboard
                updateDashboardStats();
            })
            .catch(error => {
                console.error('Error al cargar facturas:', error);
            });
    }
    
    // Abrir modal de factura
    function openInvoiceModal(invoiceId = null) {
        const modal = document.getElementById('invoice-modal');
        const title = document.getElementById('invoice-modal-title');
        const form = document.getElementById('invoice-form');
        const entitySelect = document.getElementById('invoice-entity');
        
        // Cargar clientes y proveedores en el select
        entitySelect.innerHTML = '<option value="">Seleccionar cliente/proveedor</option>';
        
        // Agregar clientes
        appState.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = `client_${client.id}`;
            option.textContent = `${client.name} (Cliente)`;
            entitySelect.appendChild(option);
        });
        
        // Nota: Aquí deberíamos agregar proveedores también
        
        if (invoiceId) {
            // Modo edición
            title.textContent = 'Editar Factura';
            const invoice = appState.invoices.find(i => i.id === invoiceId);
            
            if (invoice) {
                document.getElementById('invoice-id').value = invoice.id;
                document.getElementById('invoice-type').value = invoice.type || 'received';
                document.getElementById('invoice-entity').value = invoice.entityId || '';
                document.getElementById('invoice-number').value = invoice.number || '';
                document.getElementById('invoice-date').value = invoice.date ? 
                    new Date(invoice.date.seconds * 1000).toISOString().split('T')[0] : '';
                document.getElementById('invoice-amount').value = invoice.amount || '';
                document.getElementById('invoice-status').value = invoice.status || 'pending';
                document.getElementById('invoice-notes').value = invoice.notes || '';
                
                // Mostrar archivo si existe
                const fileList = document.getElementById('invoice-file-list');
                fileList.innerHTML = '';
                
                if (invoice.fileUrl) {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <div>
                            <i class="fas fa-file-pdf"></i>
                            <span>${invoice.fileName || 'archivo.pdf'}</span>
                        </div>
                        <a href="${invoice.fileUrl}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-eye"></i>
                        </a>
                    `;
                    fileList.appendChild(fileItem);
                }
            }
        } else {
            // Modo creación
            title.textContent = 'Nueva Factura';
            form.reset();
            document.getElementById('invoice-id').value = '';
            document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('invoice-file-list').innerHTML = '';
        }
        
        modal.classList.remove('hidden');
    }
    
    // Manejar upload de archivos
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const fileList = document.getElementById('invoice-file-list');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div>
                <i class="fas ${file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image'}"></i>
                <span>${file.name}</span>
                <small>(${(file.size / 1024).toFixed(1)} KB)</small>
            </div>
            <button type="button" class="btn btn-danger remove-file">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
        
        // Event listener para eliminar archivo
        fileItem.querySelector('.remove-file').addEventListener('click', function() {
            fileItem.remove();
        });
    }
    
    // Guardar factura
    function saveInvoice(e) {
        e.preventDefault();
        
        const invoiceId = document.getElementById('invoice-id').value;
        const fileInput = document.getElementById('invoice-file');
        const file = fileInput.files[0];
        
        const invoiceData = {
            type: document.getElementById('invoice-type').value,
            entityId: document.getElementById('invoice-entity').value,
            number: document.getElementById('invoice-number').value,
            date: document.getElementById('invoice-date').value,
            amount: parseFloat(document.getElementById('invoice-amount').value),
            status: document.getElementById('invoice-status').value,
            notes: document.getElementById('invoice-notes').value,
            userId: appState.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Obtener nombre de la entidad
        const entityValue = invoiceData.entityId;
        if (entityValue.startsWith('client_')) {
            const clientId = entityValue.replace('client_', '');
            const client = appState.clients.find(c => c.id === clientId);
            if (client) {
                invoiceData.entityName = client.name;
            }
        }
        
        // Función para guardar en Firestore
        const saveToFirestore = (fileData = {}) => {
            const finalData = { ...invoiceData, ...fileData };
            
            if (!invoiceId) {
                // Nueva factura
                finalData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                
                db.collection('invoices').add(finalData)
                    .then(() => {
                        alert('Factura guardada exitosamente');
                        document.getElementById('invoice-modal').classList.add('hidden');
                        loadInvoices();
                        addActivity('Factura creada', 'Se agregó una nueva factura');
                    })
                    .catch(error => {
                        console.error('Error al guardar factura:', error);
                        alert('Error al guardar factura');
                    });
            } else {
                // Actualizar factura existente
                db.collection('invoices').doc(invoiceId).update(finalData)
                    .then(() => {
                        alert('Factura actualizada exitosamente');
                        document.getElementById('invoice-modal').classList.add('hidden');
                        loadInvoices();
                        addActivity('Factura actualizada', 'Se modificó una factura');
                    })
                    .catch(error => {
                        console.error('Error al actualizar factura:', error);
                        alert('Error al actualizar factura');
                    });
            }
        };
        
        // Subir archivo si existe
        if (file) {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`invoices/${appState.currentUser.uid}/${Date.now()}_${file.name}`);
            
            fileRef.put(file)
                .then(snapshot => {
                    return snapshot.ref.getDownloadURL();
                })
                .then(downloadURL => {
                    saveToFirestore({
                        fileUrl: downloadURL,
                        fileName: file.name,
                        fileSize: file.size
                    });
                })
                .catch(error => {
                    console.error('Error al subir archivo:', error);
                    alert('Error al subir archivo, pero la factura se guardó sin él');
                    saveToFirestore(); // Guardar sin archivo
                });
        } else {
            saveToFirestore();
        }
    }
    
    // Configurar event listeners para facturas
    function setupInvoiceEventListeners() {
        document.querySelectorAll('.edit-invoice').forEach(btn => {
            btn.addEventListener('click', function() {
                const invoiceId = this.getAttribute('data-id');
                editInvoice(invoiceId);
            });
        });
        
        document.querySelectorAll('.delete-invoice').forEach(btn => {
            btn.addEventListener('click', function() {
                const invoiceId = this.getAttribute('data-id');
                deleteInvoice(invoiceId);
            });
        });
    }
    
    // Editar factura
    function editInvoice(invoiceId) {
        openInvoiceModal(invoiceId);
    }
    
    // Eliminar factura
    function deleteInvoice(invoiceId) {
        if (confirm('¿Estás seguro de eliminar esta factura?')) {
            db.collection('invoices').doc(invoiceId).delete()
                .then(() => {
                    alert('Factura eliminada exitosamente');
                    loadInvoices();
                    addActivity('Factura eliminada', 'Se eliminó una factura');
                })
                .catch(error => {
                    console.error('Error al eliminar factura:', error);
                    alert('Error al eliminar factura');
                });
        }
    }
    
    // Cargar presupuestos
    function loadBudgets() {
        // Implementación similar a loadInvoices
    }
    
    // Abrir modal de presupuesto
    function openBudgetModal(budgetId = null) {
        const modal = document.getElementById('budget-modal');
        const clientSelect = document.getElementById('budget-client');
        
        // Cargar clientes en el select
        clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        appState.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
        
        if (budgetId) {
            // Modo edición
            // Cargar datos del presupuesto
        } else {
            // Modo creación
            document.getElementById('budget-form').reset();
            document.getElementById('budget-id').value = '';
            document.getElementById('budget-date').value = new Date().toISOString().split('T')[0];
            
            // Limpiar items
            const itemsContainer = document.getElementById('budget-items');
            itemsContainer.innerHTML = `
                <div class="item-row">
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <input type="text" class="form-control item-description" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cantidad</label>
                        <input type="number" class="form-control item-quantity" min="1" value="1" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Precio Unitario</label>
                        <input type="number" class="form-control item-price" step="0.01" min="0" required>
                    </div>
                    <button type="button" class="remove-item" disabled>
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            `;
            
            document.getElementById('budget-total').textContent = '$0.00';
        }
        
        modal.classList.remove('hidden');
    }
    
    // Agregar ítem a presupuesto
    function addBudgetItem() {
        const itemsContainer = document.getElementById('budget-items');
        const itemCount = itemsContainer.children.length;
        
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <div class="form-group">
                <label class="form-label">Descripción</label>
                <input type="text" class="form-control item-description" required>
            </div>
            <div class="form-group">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control item-quantity" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label class="form-label">Precio Unitario</label>
                <input type="number" class="form-control item-price" step="0.01" min="0" required>
            </div>
            <button type="button" class="remove-item">
                <i class="fas fa-minus"></i>
            </button>
        `;
        
        itemsContainer.appendChild(itemRow);
        
        // Habilitar botón de eliminar si hay más de un ítem
        if (itemCount === 0) {
            itemsContainer.querySelector('.remove-item').disabled = false;
        }
        
        // Event listener para eliminar ítem
        itemRow.querySelector('.remove-item').addEventListener('click', function() {
            itemRow.remove();
            calculateBudgetTotal();
            
            // Si solo queda un ítem, deshabilitar su botón de eliminar
            const remainingItems = itemsContainer.children.length;
            if (remainingItems === 1) {
                itemsContainer.querySelector('.remove-item').disabled = true;
            }
        });
    }
    
    // Calcular total del presupuesto
    function calculateBudgetTotal() {
        const itemsContainer = document.getElementById('budget-items');
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        
        let total = 0;
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            total += quantity * price;
        });
        
        document.getElementById('budget-total').textContent = `$${total.toFixed(2)}`;
    }
    
    // Guardar presupuesto
    function saveBudget(e) {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const items = [];
        const itemRows = document.querySelectorAll('#budget-items .item-row');
        
        itemRows.forEach(row => {
            const description = row.querySelector('.item-description').value;
            const quantity = parseFloat(row.querySelector('.item-quantity').value);
            const price = parseFloat(row.querySelector('.item-price').value);
            
            if (description && quantity && price) {
                items.push({
                    description,
                    quantity,
                    price,
                    total: quantity * price
                });
            }
        });
        
        const budgetData = {
            clientId: document.getElementById('budget-client').value,
            number: document.getElementById('budget-number').value,
            date: document.getElementById('budget-date').value,
            validity: parseInt(document.getElementById('budget-validity').value),
            items,
            total: parseFloat(document.getElementById('budget-total').textContent.replace('$', '')),
            status: document.getElementById('budget-status').value,
            notes: document.getElementById('budget-notes').value,
            userId: appState.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const budgetId = document.getElementById('budget-id').value;
        
        if (!budgetId) {
            // Nuevo presupuesto
            budgetData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            db.collection('budgets').add(budgetData)
                .then(docRef => {
                    alert('Presupuesto creado exitosamente');
                    document.getElementById('budget-modal').classList.add('hidden');
                    loadBudgets();
                    
                    // Si el estado es "approved", ofrecer crear factura comercial
                    if (budgetData.status === 'approved') {
                        if (confirm('¿Deseas crear una factura comercial a partir de este presupuesto?')) {
                            createCommercialInvoiceFromBudget(docRef.id, budgetData);
                        }
                    }
                    
                    addActivity('Presupuesto creado', 'Se creó un nuevo presupuesto');
                })
                .catch(error => {
                    console.error('Error al crear presupuesto:', error);
                    alert('Error al crear presupuesto');
                });
        } else {
            // Actualizar presupuesto existente
            // Implementación similar
        }
    }
    
    // Crear factura comercial desde presupuesto
    function createCommercialInvoiceFromBudget(budgetId, budgetData) {
        // Obtener nombre del cliente
        const client = appState.clients.find(c => c.id === budgetData.clientId);
        const clientName = client ? client.name : 'Cliente';
        
        const invoiceData = {
            number: `FC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
            clientId: budgetData.clientId,
            clientName: clientName,
            date: new Date().toISOString().split('T')[0],
            items: budgetData.items,
            total: budgetData.total,
            origin: 'budget',
            originId: budgetId,
            notes: `Factura generada a partir del presupuesto ${budgetData.number}`,
            userId: appState.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        db.collection('commercialInvoices').add(invoiceData)
            .then(() => {
                alert('Factura comercial creada exitosamente');
                loadCommercialInvoices();
                addActivity('Factura comercial creada', 'Se generó una factura comercial desde un presupuesto');
            })
            .catch(error => {
                console.error('Error al crear factura comercial:', error);
                alert('Error al crear factura comercial');
            });
    }
    
    // Cargar facturas comerciales
    function loadCommercialInvoices() {
        // Implementación similar a loadInvoices
    }
    
    // Abrir modal de factura comercial
    function openCommercialInvoiceModal() {
        // Implementación similar a openInvoiceModal
    }
    
    // Cargar cuentas corrientes
    function loadAccounts() {
        const tableBody = document.getElementById('accounts-table-body');
        tableBody.innerHTML = '';
        
        // Calcular saldos por cliente
        const clientBalances = {};
        
        appState.clients.forEach(client => {
            clientBalances[client.id] = {
                clientName: client.name,
                totalInvoiced: 0,
                totalPaid: 0,
                balance: 0
            };
        });
        
        // Calcular total facturado y pagado
        appState.invoices.forEach(invoice => {
            if (invoice.type === 'issued' && invoice.entityId) {
                const clientId = invoice.entityId.replace('client_', '');
                
                if (clientBalances[clientId]) {
                    clientBalances[clientId].totalInvoiced += invoice.amount || 0;
                    
                    if (invoice.status === 'paid') {
                        clientBalances[clientId].totalPaid += invoice.amount || 0;
                    }
                }
            }
        });
        
        // Calcular saldo y agregar filas
        Object.keys(clientBalances).forEach(clientId => {
            const balance = clientBalances[clientId];
            balance.balance = balance.totalInvoiced - balance.totalPaid;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${balance.clientName}</td>
                <td>$${balance.totalInvoiced.toFixed(2)}</td>
                <td>$${balance.totalPaid.toFixed(2)}</td>
                <td>$${balance.balance.toFixed(2)}</td>
                <td>
                    <button class="btn btn-primary view-client-detail" data-client="${clientId}">
                        <i class="fas fa-eye"></i> Detalle
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Actualizar estadísticas del dashboard
    function updateDashboardStats() {
        const totalInvoices = appState.invoices.length;
        const paidInvoices = appState.invoices.filter(i => i.status === 'paid').length;
        const pendingInvoices = appState.invoices.filter(i => i.status === 'pending').length;
        const overdueInvoices = appState.invoices.filter(i => i.status === 'overdue').length;
        
        document.getElementById('total-invoices').textContent = totalInvoices;
        document.getElementById('paid-invoices').textContent = paidInvoices;
        document.getElementById('pending-invoices').textContent = pendingInvoices;
        document.getElementById('overdue-invoices').textContent = overdueInvoices;
    }
    
    // Agregar actividad reciente
    function addActivity(title, description) {
        const activityList = document.getElementById('recent-activity');
        
        // Crear elemento de actividad
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div>
                <p><strong>${title}</strong></p>
                <small>${description} - ${new Date().toLocaleTimeString()}</small>
            </div>
        `;
        
        // Agregar al inicio de la lista
        if (activityList.children.length > 0) {
            activityList.insertBefore(activityItem, activityList.firstChild);
        } else {
            activityList.appendChild(activityItem);
        }
        
        // Limitar a 5 actividades
        if (activityList.children.length > 5) {
            activityList.removeChild(activityList.lastChild);
        }
    }
    
    // Mostrar mensaje de error
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
        }
    }
    
    // Obtener mensaje de error de autenticación
    function getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'El email no es válido';
            case 'auth/user-disabled':
                return 'La cuenta ha sido deshabilitada';
            case 'auth/user-not-found':
                return 'No existe una cuenta con este email';
            case 'auth/wrong-password':
                return 'Contraseña incorrecta';
            case 'auth/email-already-in-use':
                return 'El email ya está en uso';
            case 'auth/weak-password':
                return 'La contraseña es demasiado débil';
            case 'auth/operation-not-allowed':
                return 'Operación no permitida';
            default:
                return 'Error de autenticación';
        }
    }
    
    // Limpiar formulario
    function clearForm(form) {
        form.reset();
    }
    
    // Limpiar datos de la aplicación
    function clearAppData() {
        appState.clients = [];
        appState.suppliers = [];
        appState.invoices = [];
        appState.budgets = [];
        appState.commercialInvoices = [];
        
        // Limpiar tablas
        document.getElementById('clients-table-body').innerHTML = '';
        document.getElementById('suppliers-table-body').innerHTML = '';
        document.getElementById('invoices-table-body').innerHTML = '';
        document.getElementById('budgets-table-body').innerHTML = '';
        document.getElementById('commercial-invoices-table-body').innerHTML = '';
        document.getElementById('accounts-table-body').innerHTML = '';
        document.getElementById('recent-activity').innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div>
                    <p>No hay actividad reciente</p>
                    <small>Las acciones que realices aparecerán aquí</small>
                </div>
            </div>
        `;
    }
    
    // Inicializar la aplicación
    initApp();
});