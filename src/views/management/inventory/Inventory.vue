<template>
    <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>

    <section>
        <header class="ion-padding">
            <ion-segment :scrollable="true" :value="subSegmentValue" v-model="subSegmentValue">
                <ion-segment-button v-for="subSection in subSections" :value="subSection.id" :key="subSection.id">
                    <ion-label>{{ subSection.title }}</ion-label>
                </ion-segment-button>
            </ion-segment>
        </header>
        <main class="content">
            <section>
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


                        <ion-fab slot="fixed" vertical="bottom" horizontal="end" :edge="false">
                            <ion-fab-button @click="createWarehouse">
                                <ion-icon :icon="addOutline"></ion-icon>
                            </ion-fab-button>
                        </ion-fab>
                    </article>

                    <article v-if="subSegmentValue == 'Productos'" class="limiter">
                        <article class="ion-padding">
                            <ion-searchbar v-model="dynamicData.query" :animated="true" placeholder="Buscar Producto"></ion-searchbar>
                        </article>

                        <DynamicScroller
                            :items="productsUI"
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
                                    <ion-item  button @click="editProduct(item)">
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
                </main>
            </section>
        </main>
    </section>
</template>

<script setup lang="ts">
import CreateInventoryProduct from '@/dialogs/CreateInventoryProduct/CreateInventoryProduct.vue';
import CreateInventoryProductsPack from '@/dialogs/CreateInventoryProductsPack/CreateInventoryProductsPack.vue';
import CreateWarehouse from '@/dialogs/CreateWarehouse/CreateWarehouse.vue';
import EditInventoryProduct from '@/dialogs/EditInventoryProduct/EditInventoryProduct.vue';
import EditInventoryProductsPack from '@/dialogs/EditInventoryProductsPack/EditInventoryProductsPack.vue';
import { IProduct, IProductsPack, IWarehouse } from '@/interfaces/InventoryInterfaces';
import { AppEvents } from '@/utils/AppEvents/AppEvents';
import { Dialog } from '@/utils/Dialog/Dialog';
import { RequestAPI } from '@/utils/Requests/RequestAPI';
import { Session } from '@/utils/Session/Session';
import { InventoryStore } from '@/utils/Stored/InventoryStore';
import { Viewport } from '@/utils/Viewport/Viewport';
import { IonFab, IonFabButton, IonIcon, IonItem, IonLabel, IonList, IonAvatar, IonSearchbar, IonSegment, IonSegmentButton, IonProgressBar } from '@ionic/vue';
import { addOutline, homeOutline, logoDropbox, storefrontOutline } from 'ionicons/icons';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

const router = useRouter();
const isLoading = ref<boolean>(false);
const subSegmentValue = ref<string>('Almacenes');
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
    }
]);
const warehousesData = ref<IWarehouse[]>([]);
const productsData = ref<IProduct[]>([]);
const productsPacksData = ref<IProductsPack[]>([]);

const dynamicData = ref({
    query: ''
})


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
    })
})


const openWarehouse = (warehouse: IWarehouse) => {
    router.push(`/inventory/warehouses/${warehouse.id}`);
}

const createWarehouse = () => {
    Dialog.show(CreateWarehouse, {
        props: {
            
        },
        onLoaded($this) {
            $this.on('created', (event:any) => {
                AppEvents.emit('inventory:reload')
            })
        },
        modalControllerOptions: {
            
        }
    })
}
const createProduct = () => {
    Dialog.show(CreateInventoryProduct, {
        onLoaded($this) {
            $this.on('created', (event:any) => {
                AppEvents.emit('inventory:reload')
            })
        },
        modalControllerOptions: {
            
        }
    })
}
const createProductsPack = () => {
    Dialog.show(CreateInventoryProductsPack, {
        onLoaded($this) {
            $this.on('created', (event:any) => {
                AppEvents.emit('inventory:reload')
            })
        },
        modalControllerOptions: {
            
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
                AppEvents.emit('inventory:reload')
            })
            $this.on('updated', (event:any) => {
                AppEvents.emit('inventory:reload')
            })
        },
        modalControllerOptions: {
            
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
                AppEvents.emit('inventory:reload')
            })
            $this.on('updated', (event:any) => {
                AppEvents.emit('inventory:reload')
            })
        },
        modalControllerOptions: {
            
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

onMounted(() => {
    loadWarehouses();
    loadProducts();
    loadProductsPacks();


    const callbackId = AppEvents.on('inventory:reload', () => {
        loadWarehouses();
        loadProducts();
        loadProductsPacks();
    })
    onUnmounted(() => {
        AppEvents.off('inventory:reload', callbackId);
    })
})
</script>

<style scoped lang="scss">
.content{
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
}

.scroller {
    height: calc(89vh - 280px);
}
</style>

