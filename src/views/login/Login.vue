<template>
    <ion-page ref="page">
        <ion-header>
        </ion-header>
        <ion-content class="ion-padding" :scrollX="false" :scrollY="false">
            <section ref="holder" class="holder ion-padding">
                <article style="">
                    <header>
                        <ion-img v-if="currentDeviceTheme == 'light'" :src="MaranathaLogo" style="width: 90%;margin: 0 auto;"></ion-img>
                        <ion-img v-if="currentDeviceTheme == 'dark'" :src="MaranathaLogoDark" style="width: 90%;margin: 0 auto;"></ion-img>
                    </header>
                    <main>
                        <ion-list>
                            <ion-item>
                                <ion-input label="Usuário" ref="usernameInput" label-placement="stacked" v-model="loginData.username" autocapitalize="off" placeholder="Nombre de usuário" ></ion-input>
                            </ion-item>
                            <ion-item>
                                <ion-input ref="passwordInput" label="Contraseña" type="password" label-placement="stacked" v-model="loginData.password" placeholder="Ingresa su clave" @keyup.enter="doLogin"></ion-input>
                            </ion-item>
                        </ion-list>
                    </main>
                    <footer>
                        <ion-button v-if="!isLoading" :disabled="!enableLoginButton" expand="block" @click="doLogin">Iniciar sesión</ion-button>
                        <ion-button v-if="!isLoading" expand="block" fill="outline" @click="addUser">Crear una cuenta</ion-button>

                        <IonProgressBar v-if="isLoading" type="indeterminate"></IonProgressBar>
                    </footer>
                </article>
            </section>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonImg, IonList, IonInput, IonItem, IonButton, IonProgressBar, alertController } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import MaranathaLogo from '&/assets/images/maranatha-logo.svg';
import MaranathaLogoDark from '&/assets/images/maranatha-logo-dark.svg';

import { Session } from '@/utils/Session/Session';
import { useRouter } from 'vue-router';
import { RequestAPI } from '@/utils/Requests/RequestAPI';
import { Dialog } from '@/utils/Dialog/Dialog';
import CreateUser from '@/dialogs/CreateUser/CreateUser.vue';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { Theme } from '@/utils/Theme/Theme';

const page = ref<HTMLElement|null>(null);
const holder = ref<HTMLElement|null>(null);

const passwordInput = ref(null)
const usernameInput = ref(null)

const router = useRouter();
const loginData = ref({
    username: '',
    password: ''
});

const enableLoginButton = computed(() => {
    return loginData.value.username.length > 0 && loginData.value.password.length >= 8;
})
const currentDeviceTheme = computed(() => {
    return Theme.getTheme();
});

const isLoading = ref(false);
const doLogin = () => {
    isLoading.value = true;
    Session.login(loginData.value.username, loginData.value.password).then((response) => {
        router.push('/my-reports');
    }).catch((error) => {
        if (error.message == "Invalid credentials"){
            alertController.create({
                header: 'Oops...',
                message: 'Usuario o contraseña incorrectos',
                buttons: ['OK']
            }).then((alert) => {
                alert.present();
            });
        }else{
            alertController.create({
                header: 'Oops...',
                message: error.message,
                buttons: ['OK']
            }).then((alert) => {
                alert.present();
            });
        }
    }).finally(() => {
        isLoading.value = false;
    });
}

const addUser = async (prefiled:any = null) => {
    Dialog.show(CreateUser, {
        onLoaded($this) {
            $this.on('created', (event:any) => {
                loginData.value.username = event.data.username;
                loginData.value.password = event.data.password;
                doLogin();
            })
        },
        modalControllerOptions: {
            presentingElement: page,
            showBackdrop: true,
        }
    })
}

const preventLoginIfHasSession = async () => {
    if (await Session.isLogged()) {
        router.push('/my-reports');
    }
}
preventLoginIfHasSession();

onMounted(() => {
    usernameInput.value.$el.addEventListener('keyup', event => {
        if (event.key == 'Enter') {
            passwordInput.value.$el.setFocus()
        }
    })
})



if (Capacitor.isNativePlatform()){
    Keyboard.addListener('keyboardWillShow', info => {
        Keyboard.setResizeMode({
            mode: KeyboardResize.None
        });

        if (Capacitor.getPlatform() === 'ios') {
            holder.value?.style.setProperty(
                'transform',
                `translateY(-${info.keyboardHeight / 2}px)`
            );
        }else if (Capacitor.getPlatform() === 'android'){
            holder.value?.style.setProperty(
                'transform',
                `translateY(-${info.keyboardHeight / 3}px)`
            );
        }
    });

    Keyboard.addListener('keyboardDidShow', info => {

    });

    Keyboard.addListener('keyboardWillHide', () => {
        holder.value?.style.removeProperty('transform');
    });

    Keyboard.addListener('keyboardDidHide', () => {
        Keyboard.setResizeMode({
            mode: KeyboardResize.Ionic
        });
    });

}


</script>


<style scoped lang="scss">
.holder{
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    transition: transform 0.3s;

    > article{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        max-width: 400px;
        padding: 20px;
        display: flex;flex-direction: column;row-gap: 12px;
    }
}
</style>