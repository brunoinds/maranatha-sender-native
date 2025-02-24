<template>
    <ion-page ref="page">
        <ion-header ref="ionHeaderElement">
            <ion-toolbar>
                <ion-title>Inventário</ion-title>
            </ion-toolbar>
            <ion-toolbar>
                <ion-segment v-model="segmentValue">
                    <ion-segment-button v-for="section in sections" :key="section" :value="section">
                        {{ section }}
                    </ion-segment-button>
                </ion-segment>
                <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <main>
                <section v-if="segmentValue == 'Administración'">
                    <header style="border-bottom: 1px solid var(--ion-color-light-shade);">
                        <ion-segment :scrollable="true" :value="subSegmentValue" v-model="subSegmentValue" mode="md">
                            <ion-segment-button v-for="subSection in subSections" :value="subSection.id" :key="subSection.id">
                                <ion-label>{{ subSection.title }}</ion-label>
                            </ion-segment-button>
                        </ion-segment>
                    </header>

                    <main>
                        <article v-if="subSegmentValue == 'Almacenes'" class="limiter">
                            <ion-list :inset="Viewport.data.value.deviceSetting == 'DesktopLandscape'">
                                <ion-item v-for="warehouse in warehousesUI" button @click="openWarehouse(warehouse)">
                                    <ion-icon :icon="warehouse.icon" style="font-size: 34px;" slot="start" color="primary"></ion-icon>
                                    <ion-label>
                                        <h2><b>{{ warehouse.name }}</b></h2>
                                        <h3>{{ warehouse.zone }}</h3>
                                        <p>{{ warehouse.country }}</p>
                                    </ion-label>
                                </ion-item> 
                            </ion-list>
                        </article>

                        <article v-if="subSegmentValue == 'Productos'" class="limiter">
                            <article class="ion-padding">
                                <ion-searchbar v-model="dynamicData.query" :animated="true" placeholder="Buscar Producto"></ion-searchbar>
                            </article>

                            <DynamicScroller
                                :items="productsUI"
                                :min-item-size="61.4"
                                class="scroller"
                                :buffer="15"
                            >
                                <template v-slot="{ item, index, active }">
                                    <DynamicScrollerItem
                                        :item="item"
                                        :active="active"
                                        :data-index="index"
                                    >
                                        <ion-item button @click="editProduct(item)">
                                            <ion-avatar slot="start" v-if="item.image">
                                                <img :src="item.image" />
                                            </ion-avatar>
                                            <ion-label>
                                                <h2>{{ item.name }}</h2>
                                                <p>{{ item.description }}</p>
                                                <p>{{ item.brand }}</p>
                                            </ion-label>
                                        </ion-item>
                                    </DynamicScrollerItem>
                                </template>
                            </DynamicScroller>

                            <ion-fab slot="fixed" vertical="bottom" horizontal="end" :edge="false" v-if="Session.getCurrentSessionSync()?.isAdmin()">
                                <ion-fab-button @click="createProduct">
                                    <ion-icon :icon="addOutline"></ion-icon>
                                </ion-fab-button>
                            </ion-fab>
                        </article>

                        <article v-if="subSegmentValue == 'Pack de Productos'" class="limiter">
                            <ion-list :inset="Viewport.data.value.deviceSetting == 'DesktopLandscape'">
                                <ion-item v-for="productPack in productsPacksData" button :key="productPack.id" @click="editProductsPack(productPack)">
                                    <ion-icon :icon="logoDropbox" slot="start"></ion-icon>

                                    <ion-label>
                                        <h2>{{ productPack.name }}</h2>
                                        <p>{{ productPack.products.length }} productos en este pack</p>
                                    </ion-label>
                                </ion-item>
                            </ion-list>


                            <ion-fab slot="fixed" vertical="bottom" horizontal="end" :edge="false">
                                <ion-fab-button @click="createProductsPack">
                                    <ion-icon :icon="addOutline"></ion-icon>
                                </ion-fab-button>
                            </ion-fab>
                        </article>
                        <article v-if="subSegmentValue == 'Reportes'">
                            <br>
                            <Records location="InventoryManagement"></Records>
                        </article>
                    </main>
                    
                </section>

                <section v-if="segmentValue == 'Mis Pedidos'">
                    <article  class="limiter">

                        <ion-accordion-group>
                            <ion-accordion>
                                <ion-item slot="header">
                                    <ion-icon color="primary" :icon="bagHandleOutline" slot="start"></ion-icon>
                                    <ion-label>
                                        <h2><b>Mis Pedidos</b></h2>
                                        <p v-if="isLoading">Cargando solicitudes...</p>
                                        <p v-else>{{ outcomesUI.reduce((acc, job) => acc + job.outcomes.length, 0) }} solicitudes</p>
                                    </ion-label>
                                </ion-item>
                                <div slot="content" class="ion-padding">
                                    
                                    <ion-accordion-item v-for="job in outcomesUI" :key="job.job?.code" :value="job.job?.code">
                                        <template v-slot:head>
                                            <ion-item button>
                                                <ion-label>
                                                    <h2><b>{{ job.job?.code }} - {{ job.job?.name }}</b></h2>
                                                    <p>{{ job.outcomes.length }} solicitudes</p>
                                                </ion-label>
                                            </ion-item>
                                        </template>
                                        <template #body>
                                            <div class="ion-padding">
                                                <DynamicScroller
                                                    :items="job.outcomes"
                                                    :min-item-size="70"
                                                    class="scroller"
                                                    :buffer="15"
                                                >
                                                    <template v-slot="{ item, index, active }">
                                                        <DynamicScrollerItem
                                                            :item="item"
                                                            :active="active"
                                                            :data-index="index"
                                                        >
                                                            <ion-item button @click="openWarehouseOutcomeRequest(item)">
                                                                <ion-label>
                                                                    <h2><b>Pedido #00{{ item.id }}</b></h2>
                                                                    <p>{{ item.date_ago }}</p>
                                                                    <p><b>Job:</b> {{ item.job?.code }} {{ item.job?.name }}</p>
                                                                    <p><b>Expense:</b> {{ item.expense?.code }} {{ item.expense?.name }}</p>
                                                                    <p><b>{{ item.products_count }} ítems solicitados</b></p>
                                                                </ion-label>
                                                                
                                                                <OutcomeRequestStatusChip slot="end" :request="item" :view-mode="'Requester'" />
                                                            </ion-item>
                                                        </DynamicScrollerItem>
                                                    </template>
                                                </DynamicScroller>
                                            </div>
                                        </template>
                                    </ion-accordion-item>
                                </div>
                            </ion-accordion>

                            <ion-accordion>
                                <ion-item slot="header">
                                    <ion-icon color="primary" :icon="gitCompareOutline" slot="start"></ion-icon>
                                    <ion-label>
                                        <h2><b>Mis Préstamos</b></h2>
                                        <p v-if="isLoading">Cargando préstamos...</p>
                                        <p v-else>{{ loansUI.reduce((acc, job) => acc + job.loans.length, 0) }} préstamos</p>
                                    </ion-label>
                                </ion-item>
                                <div slot="content" class="ion-padding">

                                    <ion-accordion-item v-for="job in loansUI" :key="job.job?.code" :value="job.job?.code">
                                        <template v-slot:head>
                                            <ion-item button>
                                                <ion-label>
                                                    <h2><b>{{ job.job?.code }} - {{ job.job?.name }}</b></h2>
                                                    <p>{{ job.loans.length }} préstamos</p>
                                                </ion-label>
                                            </ion-item>
                                        </template>
                                        <template #body>
                                            <div class="ion-padding">
                                                <DynamicScroller
                                                    :items="job.loans"
                                                    :min-item-size="70"
                                                    class="scroller"
                                                    :buffer="15"
                                                >
                                                    <template v-slot="{ item, index, active }">
                                                        <DynamicScrollerItem
                                                            :item="item"
                                                            :active="active"
                                                            :data-index="index"
                                                        >
                                                            <ion-item button @click="openLoan(item)">
                                                                <ion-avatar slot="start" >
                                                                    <img :src="item.product_item?.product.image" />
                                                                </ion-avatar>
                                                                <ion-label>
                                                                    <h2><b>{{ item.product_item?.product.name }}</b></h2>
                                                                    <p>{{ item.product_item?.product.description }}</p>
                                                                    <p>{{ item.product_item?.product.brand }}</p>

                                                                    <p><b>Job:</b> {{ item.job?.code }} {{ item.job?.name }}</p>
                                                                    <p><b>Expense:</b> {{ item.expense?.code }} {{ item.expense?.name }}</p>
                                                                </ion-label>

                                                                <ProductItemLoanStatusChip slot="end" :request="item" />
                                                            </ion-item>
                                                        </DynamicScrollerItem>
                                                    </template>
                                                </DynamicScroller>
                                            </div>
                                        </template>
                                    </ion-accordion-item>

                                </div>
                            </ion-accordion>
                        </ion-accordion-group>


                        <ion-fab slot="fixed" vertical="bottom" horizontal="end" :edge="false">
                            <ion-fab-button @click="openQrCodeScanner('Requester')">
                                <ion-icon :icon="qrCodeOutline"></ion-icon>
                            </ion-fab-button>
                            <br>
                            <ion-fab-button @click="createWarehouseOutcomeRequest">
                                <ion-icon :icon="addOutline"></ion-icon>
                            </ion-fab-button>
                        </ion-fab>
                    </article>
                </section>
            </main>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import Records from '@/views/management/records/Records.vue';
import { IonAvatar, IonButton, IonContent, IonFab, IonListHeader, IonAccordion, IonAccordionGroup, IonFabButton, IonSearchbar, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonPage, IonProgressBar, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue';
import { computed, onUnmounted, ref } from 'vue';
import { Dialog } from '../../utils/Dialog/Dialog';
import { RequestAPI } from '../../utils/Requests/RequestAPI';
import OutcomeRequestStatusChip from '@/components/OutcomeRequestStatusChip/OutcomeRequestStatusChip.vue';
import CreateInventoryProduct from '@/dialogs/CreateInventoryProduct/CreateInventoryProduct.vue';
import CreateInventoryProductsPack from '@/dialogs/CreateInventoryProductsPack/CreateInventoryProductsPack.vue';
import CreateInventoryWarehouseOutcomeRequest from '@/dialogs/CreateInventoryWarehouseOutcomeRequest/CreateInventoryWarehouseOutcomeRequest.vue';
import CreateWarehouse from '@/dialogs/CreateWarehouse/CreateWarehouse.vue';
import { IProduct, IProductsPack, IWarehouse, IWarehouseOutcomeRequest, IWarehouseProductItemLoan } from '@/interfaces/InventoryInterfaces';
import { Session } from '@/utils/Session/Session';
import { Viewport } from '@/utils/Viewport/Viewport';
import { addOutline, chatbubbleEllipsesOutline, logoDropbox, qrCodeOutline, storefrontOutline, openOutline, bagHandleOutline, gitCompareOutline, homeOutline } from 'ionicons/icons';
import TimeAgo from 'javascript-time-ago';
import es from 'javascript-time-ago/locale/es';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AppEvents } from '../../utils/AppEvents/AppEvents';

import EditInventoryProduct from '@/dialogs/EditInventoryProduct/EditInventoryProduct.vue';
import EditInventoryProductsPack from '@/dialogs/EditInventoryProductsPack/EditInventoryProductsPack.vue';
import { InventoryStore } from '@/utils/Stored/InventoryStore';
import { QRCodeScanner } from '@/dialogs/QRCodeScanner/QRCodeScanner';
import {IonPeekPop, IonPeekPopContextMenuItem} from 'ion-peek-pop';
import 'ion-peek-pop/styles.css';
import ProductItemLoanStatusChip from '@/components/ProductItemLoanStatusChip/ProductItemLoanStatusChip.vue';
import EditInventoryWarehouseLoan from '@/dialogs/EditInventoryWarehouseLoan/EditInventoryWarehouseLoan.vue';
import { DynamicScroller, DynamicScrollerItem, RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { IExpense, IJob } from '@/interfaces/JobsAndExpensesInterfaces';
import { JobsAndExpenses } from '@/utils/Stored/JobsAndExpenses';
import _ from 'lodash';
import IonAccordionItem from '@/components/IonAccordionItem/IonAccordionItem.vue';

TimeAgo.addLocale(es);
const timeAgo = new TimeAgo('es-PE');

const isLoading = ref<boolean>(true);
const router = useRouter();
const page = ref<HTMLElement|null>(null);
const segmentValue = ref<string>('Mis Pedidos');
const subSegmentValue = ref<string>('Almacenes');

const ionHeaderElement = ref<HTMLElement>();

const warehousesData = ref<IWarehouse[]>([]);
const outcomeRequestsData = ref<IWarehouseOutcomeRequest[]>([]);
const loansData = ref<IWarehouseProductItemLoan[]>([]);
const productsData = ref<IProduct[]>([]);
const productsPacksData = ref<IProductsPack[]>([]);

const jobsAndExpenses = ref<{jobs: Array<IJob>, expenses: Array<IExpense>}>({
    jobs: [],
    expenses: []
});

const productsUI = computed(() => {
    return productsData.value.filter((product) => {
        if (dynamicData.value.query.trim().length > 0) {
            return product.name.toLowerCase().includes(dynamicData.value.query.toLowerCase());
        }
        return true;
    }).toSorted((a, b) => {
        return a.name.localeCompare(b.name);
    });
})

const loadJobsAndExpenses = async () => {
    const jobs =  await JobsAndExpenses.getJobs() as unknown as Array<IJob>;
    jobsAndExpenses.value.jobs = jobs

    const expenses = await JobsAndExpenses.getExpenses() as unknown as Array<IExpense>;
    jobsAndExpenses.value.expenses = expenses;
}

const subSections = ref([
    {
        id: 'Almacenes',
        title: '🏭 Almacenes',
    },
    {
        id: 'Productos',
        title: '🛠 Productos',
    },
    {
        id: 'Pack de Productos',
        title: '🧰 Pack de Productos',
    },
    {
        id: 'Reportes',
        title: '📄 Reportes',
    }
]);
const dynamicData = ref({
    query: '',
})
const outcomesUI = computed(() => {
    const outcomes = outcomeRequestsData.value.map((outcome) => {
        return {
            ...outcome,
            date_ago: timeAgo.format(new Date(outcome.requested_at || outcome.created_at)),
            products_count: outcome.requested_products.reduce((acc, product) => acc + product.quantity, 0),
            job: jobsAndExpenses.value.jobs.find((job) => job.code == outcome.job_code),
            expense: jobsAndExpenses.value.expenses.find((expense) => expense.code == outcome.expense_code),
            original: outcome
        }
    }).sort((a, b) => b.id - a.id);


    return Object.keys(_.groupBy(outcomes, 'job_code')).map((jobCode) => {
        return {
            job: jobsAndExpenses.value.jobs.find((job) => job.code == jobCode),
            outcomes: outcomes.filter((outcome) => outcome.job_code == jobCode)
        }
    });
});
const loansUI = computed(() => {
    const loans = loansData.value.map((loan) => {
        return {
            ...loan,
            date: timeAgo.format(new Date(loan.created_at)),
            job: jobsAndExpenses.value.jobs.find((job) => job.code == loan.job_code),
            expense: jobsAndExpenses.value.expenses.find((expense) => expense.code == loan.expense_code),
        }
    }).sort((a, b) => b.id - a.id);



    return Object.keys(_.groupBy(loans, 'job_code')).map((jobCode) => {
        return {
            job: jobsAndExpenses.value.jobs.find((job) => job.code == jobCode),
            loans: loans.filter((loan) => loan.job_code == jobCode)
        }
    });
});

const warehousesUI = computed(() => {
    return warehousesData.value.map((warehouse) => {
        return {
            ...warehouse,
            icon: (() => {
                if (warehouse.name.toLowerCase().includes('casa')){
                    return homeOutline
                }else{
                    return storefrontOutline
                }
            })()
        }
    }).filter((warehouse) => {
        return warehouse.owners.includes(Session.getCurrentSessionSync()?.id() as number) || Session.getCurrentSessionSync()?.roles().includes('admin');
    });
})

const sections = computed(() => {
    const sections = [
        'Mis Pedidos',
        'Administración'
    ];

    if (Session.getCurrentSessionSync()?.roles().includes('admin')){
        return sections;
    }

    if (warehousesUI.value.length == 0){
        return ['Mis Pedidos'];
    }

    return sections;
});



const openWarehouse = (warehouse: IWarehouse) => {
    router.push(`/inventory/warehouses/${warehouse.id}`);
}
const openQrCodeScanner = (viewModeAs:string) => {
    QRCodeScanner.open().onScan().then((content) => {
        if (content.includes('app/inventory/outcome-requests/')){
            const id = content.split('?view-mode')[0].split('/').pop();
            router.push(`/inventory/outcome-requests/${id}?view-mode=${viewModeAs}`);
        }
    })
}

const loadWarehouses = async () => {
    isLoading.value = true;
    try {
        const response = await InventoryStore.getWarehouses();
        warehousesData.value = response;

    } catch (error) {
    }
    isLoading.value = false;
}
const loadOutcomeRequests = async () => {
    isLoading.value = true;
    try {
        const response = await RequestAPI.get('/inventory/me/outcome-requests');
        outcomeRequestsData.value = response;

    } catch (error) {
    }
    isLoading.value = false;
}
const loadLoans = async () => {
    isLoading.value = true;
    try {
        const response = await RequestAPI.get('/inventory/me/loans');
        loansData.value = response;

    } catch (error) {
    }
    isLoading.value = false;
}
const loadProducts = async () => {
    isLoading.value = true;
    try {
        const response = await InventoryStore.getProducts();
        productsData.value = response;

    } catch (error) {
    }
    isLoading.value = false;
}
const loadProductsPacks = async () => {
    isLoading.value = true;
    try {
        const response = await InventoryStore.getProductsPacks();
        productsPacksData.value = response;
    } catch (error) {
    }
    isLoading.value = false;
}


const openWarehouseOutcomeRequest = (outcome: IWarehouseOutcomeRequest) => {
    router.push(`/inventory/outcome-requests/${outcome.id}?view-mode=Requester`);
}

const openWarehouseOutcomeRequestChat = (warehouseOutcomeRequest: IWarehouseOutcomeRequest) => {
    router.push(`/inventory/outcome-requests/${warehouseOutcomeRequest.id}/chat`);
}
const openLoan = (loan: IWarehouseProductItemLoan) => {
    Dialog.show(EditInventoryWarehouseLoan, {
        props: {
            productItemLoanId: loan.id
        },
        onLoaded($this) {
            
        }
    })
}
const createWarehouseOutcomeRequest = () => {
    Dialog.show(CreateInventoryWarehouseOutcomeRequest, {
        props: {
            
        },
        onLoaded($this) {
            $this.on('created', (event:any) => {
                loadOutcomeRequests();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}

const createWarehouse = () => {
    Dialog.show(CreateWarehouse, {
        props: {
            
        },
        onLoaded($this) {
            $this.on('created', (event:any) => {
                loadWarehouses()
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}
const createProduct = () => {
    Dialog.show(CreateInventoryProduct, {
        onLoaded($this) {
            $this.on('created', (event:any) => {
                loadProducts();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}
const createProductsPack = () => {
    Dialog.show(CreateInventoryProductsPack, {
        onLoaded($this) {
            $this.on('created', (event:any) => {
                loadProductsPacks();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}
const editProductsPack = (productsPack: IProductsPack) => {
    Dialog.show(EditInventoryProductsPack, {
        props: {
            productsPack
        },
        onLoaded($this) {
            $this.on('deleted', (event:any) => {
                loadProductsPacks();
            })
            $this.on('updated', (event:any) => {
                loadProductsPacks();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}
const editProduct = (product: IProduct) => {
    Dialog.show(EditInventoryProduct, {
        props: {
            product
        },
        onLoaded($this) {
            $this.on('deleted', (event:any) => {
                loadProducts();
            })
            $this.on('updated', (event:any) => {
                loadProducts();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}

onMounted(() => {
    loadWarehouses();
    loadOutcomeRequests();
    loadProducts();
    loadProductsPacks();
    loadLoans();
    loadJobsAndExpenses();

    const callbackId = AppEvents.on('inventory:reload', () => {
        loadWarehouses();
        loadOutcomeRequests();
        loadProducts();
        loadProductsPacks();
        loadLoans();
    })
    onUnmounted(() => {
        AppEvents.off('inventory:reload', callbackId);
    })
})

</script>


<style scoped lang="scss">
.limiter{
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
}


ion-fab[slot="fixed"]{
    position: fixed;
}

.scroller {
    height: calc(92vh - 228px);
}
</style>