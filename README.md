# Contadinho — app

App do Contadinho, app pessoal de finanças que divide a fatura do cartão com a família e controla quem já pagou.

Vue 3 com TypeScript e Vite, empacotado com Capacitor 8. A primeira plataforma é o Android; o iOS vem depois. A API fica no [Contadinho-backend](https://github.com/paulooliver2/Contadinho-backend).

## Pré-requisitos

- Node 22.18 ou mais novo (`.nvmrc`).
- Android Studio com o SDK do Android, para rodar no emulador ou no celular.
- A API rodando em `http://localhost:8080` (veja o README do backend).

## Rodar

```sh
npm install
npm run dev                 # no navegador, em http://localhost:5173
```

Enquanto o login não existe, o botão "Entrar sem conta (desenvolvimento)" libera as abas. Ele só aparece no `npm run dev`.

## Cliente da API

`src/api/schema.d.ts` é gerado a partir do `openapi.json` do backend; não edite à mão.

```sh
npm run gen:api             # usa o contrato do main do Contadinho-backend
npm run gen:api:local       # usa ../back-end/openapi.json, para trabalhar numa API ainda não publicada
```

O CI falha se o `schema.d.ts` commitado não bater com o contrato do main do backend.

## Android

```sh
npm run android:sync        # build + copia para o projeto Android
npm run android:open        # abre no Android Studio
adb reverse tcp:8080 tcp:8080   # faz o localhost:8080 do celular/emulador chegar na sua API
```

O backup automático do Android está desligado (`allowBackup="false"`) e o app só aceita HTTPS fora do `localhost`. O CI gera o APK de debug como artefato.
