<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button :disabled="isLoading" @click="emitter.fire('close')">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Editar Pedido de Productos</ion-title>
                <ion-buttons slot="end">
                    <ion-button :disabled="isLoading" @click="checkoutActions.saveOutcomeRequest">Guardar</ion-button>
                </ion-buttons>
            </ion-toolbar>
            <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>
        </ion-header>
        <ion-content>
            <section class="ion-padding">
                <article style="text-align: center;">
                    <br>
                    <ion-icon :icon="bagHandleOutline" style="font-size: 94px;" color="primary"></ion-icon>
                    <h1>Pedido de Productos</h1>
                </article>
            </section>

            <article>
                <ion-accordion-group ref="accordionGroupEl">
                    <ion-accordion value="first">
                        <ion-item slot="header" color="light">
                            <ion-label>
                                <h2><b>1. Agregar productos</b></h2>
                                <p>Selecciona los productos que deseas solicitar</p>
                            </ion-label>
                        </ion-item>
                        <section slot="content">
                            <section class="offwhite">
                                <ion-list :inset="true" v-for="product in dynamicData.productsListWithQuantity" :key="product.product.id">
                                    <ion-item>
                                        <ion-avatar slot="start" v-if="product.product?.image">
                                            <img :src="product.product?.image" />
                                        </ion-avatar>
                                        <ion-label>
                                            <h2><b>{{ product.product.name }}</b></h2>
                                            <p>{{ product.product.description }}</p>
                                            <p>{{ product.product.brand }}</p>
                                        </ion-label>
                                    </ion-item>
                                    <ion-item>
                                        <ion-input label="Cantidad" type="number" inputmode="numeric" :min="1" v-model="product.quantity" class="ion-text-right"></ion-input>
                                    </ion-item>
                                    <ion-item button :detail="false" @click="actions.removeProduct(product.product)">
                                        <ion-label color="danger" class="ion-text-center">Eliminar producto</ion-label>
                                    </ion-item>
                                </ion-list>

                                <section class="ion-padding">
                                    <ion-button fill="outline" @click="actions.addNewProduct" expand="block">
                                        <ion-icon slot="end" :icon="bagAddOutline"></ion-icon>
                                        Agregar Productos
                                    </ion-button>
                                </section>
                            </section>
                        </section>
                    </ion-accordion>
                    <ion-accordion value="second">
                        <ion-item slot="header" color="light">
                            <ion-label>
                                <h2><b>2. Datos del pedido</b></h2>
                                <p>Completa los datos del pedido</p>
                            </ion-label>
                        </ion-item>
                        <section slot="content">
                            <ion-list>
                                <ion-item-choose-dialog @click="actions.openJobSelector" placeholder="Selecciona el Job" label="Job:" :value="warehouseOutcome.job_code"/>
                                <ion-item-choose-dialog @click="actions.openExpenseSelector" placeholder="Selecciona el Expense" label="Expense:" :value="warehouseOutcome.expense_code"/>
                            </ion-list>
                        </section>
                    </ion-accordion>
                </ion-accordion-group>

                <br><br><br><br><br><br><br><br><br><br><br><br>
            </article>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import IonItemChooseDialog from '@/components/IonItemChooseDialog/IonItemChooseDialog.vue';
import ExpenseSelector from '@/dialogs/ExpenseSelector/ExpenseSelector.vue';
import InventoryProductSelector from '@/dialogs/InventoryProductSelector/InventoryProductSelector.vue';
import JobSelector from '@/dialogs/JobSelector/JobSelector.vue';
import { EInventoryWarehouseOutcomeRequestStatus, EInventoryWarehouseOutcomeRequestType, INewWarehouseOutcomeRequest, IOutcomeResumeAnalisys, IProduct, IProductWithWarehouseStock, IWarehouse, IWarehouseOutcomeRequest } from '@/interfaces/InventoryInterfaces';
import { EExpenseUses, IExpense, IJob } from '@/interfaces/JobsAndExpensesInterfaces';
import { Dialog, DialogEventEmitter } from '@/utils/Dialog/Dialog';
import { RequestAPI } from '@/utils/Requests/RequestAPI';
import { InventoryStore } from '@/utils/Stored/InventoryStore';
import { IonAccordion, IonAccordionGroup, IonAvatar, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonPage, IonProgressBar, IonSelect, IonSelectOption, IonTitle, IonToolbar, alertController, toastController } from '@ionic/vue';
import { bagAddOutline, bagHandleOutline } from 'ionicons/icons';
import { onMounted, ref } from 'vue';

const accordionGroupEl = ref<any>(null);
const isLoading = ref<boolean>(true);


const warehousesData = ref<IWarehouse[]>([]);
const props = defineProps({
    outcomeRequestId: {
        type: Number,
        required: true
    },
    emitter: {
        type: DialogEventEmitter,
        required: true
    },
});

const dynamicData = ref<{
    productsListWithQuantity: Array<{product: IProductWithWarehouseStock, quantity: number}>
}>({
    productsListWithQuantity: []
})


const warehouseOutcome = ref<IWarehouseOutcomeRequest>({
    id: 0,
    created_at: '',
    updated_at: '',
    inventory_warehouse_id: 0,
    inventory_warehouse_outcome_id: null,
    user_id: 0,
    requested_products: [],
    received_products: [],
    messages: [],
    requested_at: null,
    rejected_at: null,
    approved_at: null,
    dispatched_at: null,
    on_the_way_at: null,
    delivered_at: null,
    finished_at: null,
    status: EInventoryWarehouseOutcomeRequestStatus.Draft,
    value: undefined,
    type: EInventoryWarehouseOutcomeRequestType.Outcomes
});

const validateData = async () => {
    const formErrors: Array<{field: string, message: string}> = [];

    if (warehouseOutcome.value.inventory_warehouse_id == ""){
        formErrors.push({
            field: "inventory_warehouse_id",
            message: "Elige el almacén al que deseas solicitar productos"
        })
    }

    if (warehouseOutcome.value.job_code == ""){
        formErrors.push({
            field: "job_code",
            message: "Elige el Job al que deseas asignar la solicitud"
        })
    }

    if (warehouseOutcome.value.expense_code == ""){
        formErrors.push({
            field: "expense_code",
            message: "Elige el Expense al que deseas asignar la solicitud"
        })
    }


    if (dynamicData.value.productsListWithQuantity.length == 0 || dynamicData.value.productsListWithQuantity.reduce((acc, p) => acc + p.quantity, 0) == 0){
        formErrors.push({
            field: "products",
            message: "Al menos un producto es requerido"
        })
    }
    

    if (formErrors.length > 0){
        return {
            isValid: false,
            errors: formErrors
        };
    }else{
        return {
            isValid: true,
            errors: []
        };
    }
}

const actions = {
    addNewProduct: () => {
        Dialog.show(InventoryProductSelector, {
            props: {
                allowMultipleSelection: true,
                contextWarehouseId: warehouseOutcome.value.inventory_warehouse_id,
                showStock: true
            },
            onLoaded($this) {
                $this.on('selected', (event:any) => {
                    const products = event.data;
                    products.forEach((product:IProductWithWarehouseStock) => {
                        if (dynamicData.value.productsListWithQuantity.find((p) => p.product.id === product.id)){
                            return;
                        }
                        dynamicData.value.productsListWithQuantity.push({
                            product,
                            quantity: 1
                        })
                    })

                    
                })
                $this.on('selected-with-quantity', (event:any) => {
                    const products = event.data as Array<{product: IProductWithWarehouseStock, quantity: number}>;
                    products.forEach((product) => {
                        if (dynamicData.value.productsListWithQuantity.find((p) => p.product.id === product.product.id)){
                            return;
                        }
                        dynamicData.value.productsListWithQuantity.push(product)
                    })
                })
            },
        })
    },
    removeProduct: (product: IProduct) => {
        dynamicData.value.productsListWithQuantity = dynamicData.value.productsListWithQuantity.filter((p) => p.product.id !== product.id);
    },
    openJobSelector: () => {
        Dialog.show(JobSelector, {
            props: {
                includeDisabledJobs: false,
                jobsFilterCallback(job: IJob){
                    const warehouse = warehousesData.value.find((w) => w.id === warehouseOutcome.value.inventory_warehouse_id);

                    if (!warehouse){
                        return true;
                    }

                    if (warehouse.zone){
                        if (warehouse.country){
                            return job.zone.toLowerCase() == warehouse.zone.toLowerCase() && job.country.toLowerCase() == warehouse.country.toLowerCase();
                        }else{
                            return job.zone.toLowerCase() == warehouse.zone.toLowerCase();
                        }
                    }else{
                        if (warehouse.country){
                            return job.country.toLowerCase() == warehouse.country.toLowerCase();
                        }
                    }

                    return true;
                }
            },
            onLoaded($this) {
                $this.on('selected', (event:any) => {
                    const job = event.data;
                    warehouseOutcome.value.job_code = job.code;
                })
                
            },
        })
    },
    openExpenseSelector: () => {
        Dialog.show(ExpenseSelector, {
            props: {
                expensesFilterCallback(expense: IExpense){
                    if (!expense.uses.includes(EExpenseUses.Inventory)){
                        return false;
                    }
                    return true;
                },
                selectedExpenseCode: warehouseOutcome.value.expense_code
            },
            onLoaded($this) {
                $this.on('selected', (event:any) => {
                    const expense = event.data;
                    warehouseOutcome.value.expense_code = expense.code;
                })
                
                $this.on('close', () => {
                })
            },
        })
    }
}

const checkoutActions = {
    saveOutcomeRequest: async () => {
        const validationResponse = validateData();
        if (!(await validationResponse).isValid){
            alertController.create({
                header: "Oops...",
                subHeader: "Hay errores en el formulario",
                message: (await validationResponse).errors[0].message,
                buttons: ["OK"]
            }).then((alert) => {
                alert.present();
            })
            return;
        }

        isLoading.value = true;
        const form = {
            ...warehouseOutcome.value,
            inventory_warehouse_id: warehouseOutcome.value.inventory_warehouse_id,
            requested_products: dynamicData.value.productsListWithQuantity.map((p) => {
                return {
                    product_id: p.product.id,
                    quantity: parseFloat(p.quantity)
                }
            })
        }

        try {
            const response = await RequestAPI.put('/inventory/warehouse-outcome-requests/' + props.outcomeRequestId, form);
            props.emitter.fire('updated', {});
            props.emitter.fire('close');

            const toast = await toastController.create({
                message: '✅ Productos actualizados exitosamente',
                duration: 2000
            })
            await toast.present();
        } catch (error) {
            alertController.create({
                header: 'Oops...',
                message: error.message,
                buttons: ['OK']
            }).then(async (alert) => {
                await alert.present();
            });
        }
        isLoading.value = false;
    }
}


const loadOutcomeRequest = async () => {
    isLoading.value = true;
    const responseOutcomeRequest = await RequestAPI.get('/inventory/warehouse-outcome-requests/' + props.outcomeRequestId);
    warehouseOutcome.value = responseOutcomeRequest;

    const productsWithStock = (await RequestAPI.get(`/inventory/warehouses/${warehouseOutcome.value.inventory_warehouse_id}/stock`)).items;

    dynamicData.value.productsListWithQuantity = warehouseOutcome.value.requested_products.map((product) => {
        return {
            product: productsWithStock.find((p) => p.id === product.product_id),
            quantity: product.quantity
        }
    })
    isLoading.value = false;
}

const loadWarehouses = async () => {
    isLoading.value = true;
    const response = await InventoryStore.getWarehouses();
    warehousesData.value = response;
    isLoading.value = false;
}


onMounted(async () => {
    loadWarehouses();
    loadOutcomeRequest();
    setTimeout(() => {
        accordionGroupEl.value.$el.value = "first";
    }, 100);
})
</script>

<style scoped lang="scss">
.datetime-accordion{
    &::part(content expanded){
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--ion-color-light-tint);
    }
}

.offwhite{
    background-color: var(--ion-color-light-tint);
    padding-top: 10px;
    padding-bottom: 10px;
}
</style>