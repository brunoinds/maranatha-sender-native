<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="props.emitter.fire('close')">Cancelar</ion-button>
                </ion-buttons>
                <ion-title>Modificar Reporte</ion-title>
                <ion-buttons slot="end">    
                    <ion-button @click="saveReport">Guardar</ion-button>
                </ion-buttons>
            </ion-toolbar>
            <ion-progress-bar v-if="isLoading" type="indeterminate"></ion-progress-bar>
        </ion-header>
        <ion-content>
            <ion-list :inset="true" v-if="!isLoading">
                <ion-item>
                    <ion-input label="Nombre del reporte" label-placement="stacked" placeholder="Nombre del reporte"  v-model="dynamicData.title" :disabled="isLoading"></ion-input>
                </ion-item>

                <ion-item>
                    <ion-select label="Tipo de documento" label-placement="stacked" interface="action-sheet" v-model="dynamicData.type" :disabled="isLoading">
                        <ion-select-option value="Bill">Boletas</ion-select-option>
                        <ion-select-option value="Facture">Facturas</ion-select-option>
                    </ion-select>
                </ion-item>
                <ion-item>
                    <ion-select label="Tipo de moneda" label-placement="stacked" interface="action-sheet" v-model="dynamicData.moneyType" :disabled="isLoading">
                        <ion-select-option value="PEN">Soles (S/.)</ion-select-option>
                        <ion-select-option value="USD">Dólares ($)</ion-select-option>
                        <ion-select-option value="BRL">Reales (R$)</ion-select-option>
                        <ion-select-option value="PYG">Guaranies (₲)</ion-select-option>
                    </ion-select>
                </ion-item>
                <ion-item>
                    <ion-select label="País" label-placement="stacked" interface="action-sheet" v-model="dynamicData.country" :disabled="isLoading">
                        <ion-select-option value="PE">Perú 🇵🇪</ion-select-option>
                        <ion-select-option value="BR">Brasil 🇧🇷</ion-select-option>
                        <ion-select-option value="PY">Paraguay 🇵🇾</ion-select-option>
                        <ion-select-option value="US">EE. UU. 🇺🇸</ion-select-option>
                    </ion-select>
                </ion-item>
                <ion-item>
                    <ion-select label="Zona:" label-placement="stacked" interface="action-sheet" v-model="dynamicData.zone" :disabled="isLoading">
                        <ion-select-option v-for="zone in  _.uniq(jobsAndExpenses.jobs.map(job => job.zone))">{{ zone }}</ion-select-option>
                    </ion-select>
                </ion-item>

                <ion-item>
                    <ion-label position="stacked">Fecha de Inicio</ion-label>
                    <input class="native-input sc-ion-input-ios" v-maska data-maska="##/##/####" v-model="dynamicData.startDate" :disabled="isLoading">
                </ion-item>
                <ion-item>
                    <ion-label position="stacked">Fecha de Término</ion-label>
                    <input class="native-input sc-ion-input-ios" v-maska data-maska="##/##/####" v-model="dynamicData.endDate" :disabled="isLoading">
                </ion-item>
            </ion-list>
            <article class="ion-padding" v-if="!isLoading">
                <ion-button color="danger" @click="deleteReport" expand="block">
                    <ion-icon :icon="trashBinOutline" slot="start"></ion-icon>
                    Borrar reporte
                </ion-button>
            </article>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonImg, IonToolbar, IonTitle, IonButtons, IonThumbnail, IonContent,  IonListHeader, IonIcon, IonInput, IonSelect, IonSelectOption, IonModal, IonDatetime, IonDatetimeButton, IonButton, IonList, IonItem, IonLabel, IonProgressBar, toastController, alertController } from '@ionic/vue';
import { defineComponent, nextTick, onMounted, reactive, ref } from 'vue';
import { briefcaseOutline, trashBinOutline, camera, cameraOutline, qrCodeOutline, ticketOutline, checkmarkCircleOutline, arrowForwardCircleOutline, cash } from 'ionicons/icons';
import { DialogEventEmitter } from "../../utils/Dialog/Dialog";
import { vMaska } from "maska";
import { ECountryType, EMoneyType, EReportType } from '@/interfaces/ReportInterfaces';
import { DateTime } from 'luxon';
import { RequestAPI } from '@/utils/Requests/RequestAPI';
import { Session } from '@/utils/Session/Session';
import { AppEvents } from '@/utils/AppEvents/AppEvents';
import _ from 'lodash';
import { JobsAndExpenses } from '@/utils/Stored/JobsAndExpenses';
import { IExpense, IJob } from '@/interfaces/JobsAndExpensesInterfaces';

const isLoading = ref<boolean>(false);
const props = defineProps({
    emitter: {
        type: DialogEventEmitter,
        required: true
    },
    reportId: {
        type: Number,
        required: true
    }
});
const dynamicData = ref<{
    title: string,
    type: EReportType,
    startDate: string,
    endDate: string,
    moneyType: EMoneyType,
    country: ECountryType,
    zone: string,
    user_id: number
}>({
    title: '',
    type: EReportType.Bill,
    moneyType: EMoneyType.PEN,
    startDate: (DateTime.now().set({ day: 1}).toFormat("dd/MM/yyyy") as unknown as string).toString(),
    endDate: (DateTime.now().set({ day: 1}).plus({ month: 1}).minus({ day: 1}).toFormat("dd/MM/yyyy") as unknown as string).toString(),
    country: ECountryType.PE,
    zone: 'NoZone',
    user_id: Session.getCurrentSessionSync()?.id() as number
});

const jobsAndExpenses = ref<{jobs: Array<IJob>, expenses: Array<IExpense>}>({
    jobs: [],
    expenses: []
});

const loadJobsAndExpenses = async () => {
    const jobs =  await JobsAndExpenses.getJobs() as unknown as Array<IJob>;
    jobsAndExpenses.value.jobs = jobs.filter((job) => {
        return job.state == "Active"
    });

    const expenses = await JobsAndExpenses.getExpenses() as unknown as Array<IExpense>;
    jobsAndExpenses.value.expenses = expenses;
}

const deleteReport = async () => {
    alertController.create({
        header: '¿Estás seguro?',
        message: '¿Estás seguro que deseas borrar este reporte y todas las boletas/facturas relacionadas a él? Esta acción no se puede deshacer.',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel'
            },
            {
                text: 'Borrar',
                role: 'destructive',
                handler: () => {
                    isLoading.value = true;
                    RequestAPI.delete(`/reports/${props.reportId}`).then((response) => {
                        props.emitter.fire('deleted', {
                            ...response.report
                        });
                        toastController.create({
                            message: '✅ Reporte borrado con éxito',
                            duration: 2000
                        }).then((toast) => {
                            toast.present();
                        })
                        props.emitter.fire('close');
                        AppEvents.emit('all:reload');
                    }).catch((error) => {
                        alertController.create({
                            header: 'Oops...',
                            message: error.response.message,
                            buttons: ['OK']
                        }).then((alert) => {
                            alert.present();
                        });
                    }).finally(() => {
                        isLoading.value = false;
                    });
                }
            }
        ]
    }).then((alert) => {
        alert.present();
    })
}
const saveReport = async () => {
    const validationResponse = validateCamps();
    if (!validationResponse.isValid){
        alertController.create({
            header: 'Oops...',
            message: validationResponse.errors[0] as string,
            buttons: ['OK']
        }).then((alert) => {
            alert.present();
        });
        return;
    }


    isLoading.value = true;

    RequestAPI.patch(`/reports/${props.reportId}`, {
        user_id: dynamicData.value.user_id,
        title: dynamicData.value.title,
        type: dynamicData.value.type,
        money_type: dynamicData.value.moneyType,
        from_date: DateTime.fromFormat(dynamicData.value.startDate, "dd/MM/yyyy").toISO(),
        to_date: DateTime.fromFormat(dynamicData.value.endDate, "dd/MM/yyyy").toISO(),
        country: dynamicData.value.country,
        zone: dynamicData.value.zone
    }).then((response) => {
        props.emitter.fire('updated', {
            ...response.report
        });
        toastController.create({
            message: '✅ Reporte guardado con éxito',
            duration: 2000
        }).then((toast) => {
            toast.present();
        })
        props.emitter.fire('close');
    }).catch((error) => {
        alertController.create({
            header: 'Oops...',
            message: error.response.message,
            buttons: ['OK']
        }).then((alert) => {
            alert.present();
        });
    }).finally(() => {
        isLoading.value = false;
    });
}

const validateCamps = () => {
    let errors = [];

    if (dynamicData.value.title.trim().length == 0){
        errors.push("El nombre del reporte no puede estar vacío");
    }

    if (dynamicData.value.zone.trim().length == 0){
        errors.push("La zona no puede estar vacía");
    }

    const isStartDateValid = DateTime.fromFormat(dynamicData.value.startDate, "dd/MM/yyyy").isValid;
    const isEndDateValid = DateTime.fromFormat(dynamicData.value.endDate, "dd/MM/yyyy").isValid;

    if (!isStartDateValid){
        errors.push(DateTime.fromFormat(dynamicData.value.startDate, "dd/MM/yyyy").invalidExplanation);
    }
    if (!isEndDateValid){
        errors.push(DateTime.fromFormat(dynamicData.value.endDate, "dd/MM/yyyy").invalidExplanation);
    }

    if (isStartDateValid && isEndDateValid){
        const startDate = DateTime.fromFormat(dynamicData.value.startDate, "dd/MM/yyyy");
        const endDate = DateTime.fromFormat(dynamicData.value.endDate, "dd/MM/yyyy");

        if (startDate > endDate){
            errors.push("La fecha de inicio no puede ser mayor a la fecha de término");
        }
    }

    return {
        isValid: errors.length == 0,
        errors: errors
    }
}

const loadReport = () => {
    isLoading.value = true;
    RequestAPI.get(`/reports/${props.reportId}`).then((response) => {
        dynamicData.value = {
            title: response.title,
            type: response.type,
            moneyType: response.money_type,
            startDate: DateTime.fromISO(response.from_date).toFormat("dd/MM/yyyy"),
            endDate: DateTime.fromISO(response.to_date).toFormat("dd/MM/yyyy"),
            country: response.country,
            user_id: response.user_id,
            zone: response.zone
        }

    }).catch((error) => {
        alertController.create({
            header: 'Oops...',
            message: error.response.message,
            buttons: ['OK']
        }).then(async (alert) => {
            await alert.present();
            await alert.onDidDismiss();
            props.emitter.fire('close');
        });
    }).finally(() => {
        isLoading.value = false;
    });
}

onMounted(() => {
    loadJobsAndExpenses();
    loadReport();
});
</script>

<style scoped lang="scss">
</style>