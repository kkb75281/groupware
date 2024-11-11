<template lang="pug">
.load-wrapp
    .line
    .line
    .line
</template>

<style scoped lang="less">
.load-wrapp {
    margin: 0 10px 10px 0;
    padding: 20px 20px 20px;
    border-radius: 5px;
    text-align: center;

    &:last-child {
        margin-right: 0;
    }

    @keyframes loadingB {
        0% {
            width: 15px;
        }
        50% {
            width: 35px;
        }
        100% {
            width: 15px;
        }
    }

    .line {
        display: inline-block;
        width: 15px;
        height: 15px;
        margin-right: 8px;
        border-radius: 15px;
        background-color: var(--primary-color-400);

        &:nth-last-child(1) {
            animation: loadingB 1.5s 1s infinite;
        }
        &:nth-last-child(2) {
            animation: loadingB 1.5s 0.5s infinite;
        }
        &:nth-last-child(3) {
            animation: loadingB 1.5s 0s infinite;
        }
    }
}
</style>