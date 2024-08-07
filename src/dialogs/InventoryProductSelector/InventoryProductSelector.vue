<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="props.emitter.fire('close')">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Agregar Productos</ion-title>
                <ion-buttons slot="end">
                    <ion-button v-if="allowMultipleSelection" @click="finishSelection()">Agregar</ion-button>
                </ion-buttons>
            </ion-toolbar>
            <ion-toolbar>
                <ion-searchbar v-model="dynamicData.search" :animated="true" placeholder="Buscar Producto"></ion-searchbar>
            </ion-toolbar>
            <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>
        </ion-header>
        <ion-content>
            <ion-list v-if="allowMultipleSelection">
                <ion-item button @click="chooseFromProductsPack()" >
                    <ion-icon :icon="cubeOutline" slot="start" color="primary"></ion-icon>
                    <ion-label color="primary">
                        Elegir desde un Pack de Productos
                    </ion-label>
                </ion-item>
            </ion-list>
            <ion-list>
                <ion-item button v-for="product in productsUI" :key="product.id" @click="selectProduct(product)" :detail="false">
                    <ion-avatar slot="start" v-if="product.image">
                        <img :src="product.image" />
                    </ion-avatar>
                    <ion-label>
                        <h2>{{ product.name }}</h2>
                        <p>{{ product.description }}</p>
                        <p>{{ product.brand }}</p>

                    </ion-label>
                    <section v-if="product.stock" slot="end">
                        <ion-label class="ion-text-right">
                            <p><span v-for="(value, key) in product.stock.average_buy_price" :key="key">~{{ Toolbox.moneyFormat(value as any, key) }}<br></span></p>
                        </ion-label>
                    </section>
                    <ion-chip v-if="product.stock" :color="product.stock.in_stock_count == 0 ? 'danger' : 'success'" slot="end">
                        {{ product.stock.in_stock_count == 0 ? 'Agotado' : product.stock.in_stock_count + ' unidades' }}
                    </ion-chip>
                    <ion-icon v-if="dynamicData.selectedProducts.includes(product)" color="primary" :icon="checkmarkOutline" slot="end"></ion-icon>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { RequestAPI } from '@/utils/Requests/RequestAPI';
import { IonButton, IonButtons, IonContent, IonHeader, IonChip, IonAvatar, IonSearchbar, IonLabel, IonInput,IonIcon, IonSelect, IonSelectOption, IonItem, IonList, IonPage, IonProgressBar, IonTitle, IonToolbar, alertController, toastController } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { Dialog, DialogEventEmitter } from "../../utils/Dialog/Dialog";
import { arrowForwardCircleOutline, cubeOutline, storefrontOutline, checkmarkOutline } from 'ionicons/icons';
import { IWorker } from '@/interfaces/WorkerInterfaces';
import { IProduct, IProductWithWarehouseStock, IWarehouse } from '@/interfaces/InventoryInterfaces';
import { Toolbox } from '@/utils/Toolbox/Toolbox';
import InventoryProductsPackSelector from '@/dialogs/InventoryProductsPackSelector/InventoryProductsPackSelector.vue';
import { InventoryStore } from '@/utils/Stored/InventoryStore';

const isLoading = ref<boolean>(false);
const props = defineProps({
    emitter: {
        type: DialogEventEmitter,
        required: true
    },
    contextWarehouseId: {
        type: Number,
        required: false,
        default: null
    },
    allowMultipleSelection: {
        type: Boolean,
        required: false,
        default: false
    }
});

const productsData = ref<IProductWithWarehouseStock[]>([]);


const dynamicData = ref<{
    search: string,
    selectedProducts: IProduct[],
    selectedProductsQuantity: Array<{
        product: IProduct,
        quantity: number
    }>
}>({
    search: '',
    selectedProducts: [],
    selectedProductsQuantity: []
});


const productsUI = computed(() => {
    return productsData.value.filter((product) => {
        if (dynamicData.value.search.length === 0) return true;
        return  product.name.toLowerCase().includes(dynamicData.value.search.toLowerCase()) || 
                product.description?.toLowerCase().includes(dynamicData.value.search.toLowerCase()) || 
                product.brand?.toLowerCase().includes(dynamicData.value.search.toLowerCase());
    });
})

const loadProducts = async () => {
    isLoading.value = true;
    const response = await InventoryStore.getProducts();

    productsData.value = response;
    isLoading.value = false;
}

const loadWarehouseStockContext = async () => {
    isLoading.value = true;
    const response = await RequestAPI.get(`/inventory/warehouses/${props.contextWarehouseId}/stock`);

    productsData.value = response;
    isLoading.value = false;
}

const chooseFromProductsPack = () => {
    Dialog.show(InventoryProductsPackSelector, {
        onLoaded($this) {
            $this.on('selected', (event:any) => {
                dynamicData.value.selectedProducts = event.data.map((productPack: any) => productPack.product);
                dynamicData.value.selectedProductsQuantity = event.data.map((productPack: any) => {
                    return {
                        product: productPack.product,
                        quantity: productPack.quantity
                    }
                });
                finishSelection();
            })
        },
        modalControllerOptions: {
        }
    })
}


const finishSelection = () => {
    if (props.allowMultipleSelection){
        if (dynamicData.value.selectedProductsQuantity.length > 0){
            props.emitter.fire('selected-with-quantity', dynamicData.value.selectedProductsQuantity);
        }else{
            props.emitter.fire('selected', dynamicData.value.selectedProducts);
        }
    } else {
        props.emitter.fire('selected', dynamicData.value.selectedProducts[0]);
    }
    props.emitter.fire('close');
}

const selectProduct = (product: IProduct) => {
    if (dynamicData.value.selectedProducts.includes(product)){
        dynamicData.value.selectedProducts = dynamicData.value.selectedProducts.filter((selectedProduct) => selectedProduct.id !== product.id);
    } else {
        if (!props.allowMultipleSelection){
            dynamicData.value.selectedProducts = [product];
            finishSelection();
        }else{
            dynamicData.value.selectedProducts.push(product);
        }
    }
}


onMounted(() => {
    if (props.contextWarehouseId){
        loadWarehouseStockContext();
    }else{
        loadProducts();
    }
})


</script>

<style scoped lang="scss">
</style>