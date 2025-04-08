<template lang="pug">
#localeSelector(:class="{'show' : props.showLocale}" @click.stop)
    .wrap
        .country(v-for="(c, key) in Countries" @click="handleCountryClick(key, c.dial_code)" :class="{'selected' : selectedFlag == key}") 
            img.flag(:src="'https://flagcdn.com/' + c.code.toLowerCase() + '.svg'" style="width:16px; object-fit:contain")
            .name {{ key }} - {{ c.name }} ({{ c.dial_code }})
</template>
<script setup>
import { Countries } from '@/components/countries';
import { ref, onBeforeUnmount, onMounted } from 'vue';

let emit = defineEmits(['close', 'update:modelValue', 'select-country']);
let props = defineProps(['showLocale', 'modelValue']);
let selectedFlag = ref('');

onMounted(() => {
    document.addEventListener('mouseup', closeLocale);
})
onBeforeUnmount(() => {
    document.removeEventListener('mouseup', closeLocale);
})

let showFlagImg = (code) => {
    let codePoints = code.split(' ');
    let htmlEntities = codePoints.map(code => code.replace('U+', '&#x') + ';');

    return htmlEntities.join('');
}

let handleCountryClick = (key, dialCode) => {
    selectedFlag.value = key;
    emit('update:modelValue', key);
    emit('select-country', { key, dialCode });
    emit('close');
};

let closeLocale = (e) => {
    let localeSelector = document.querySelector('#localeSelector');

    if(!localeSelector.contains(e.target)) {
        emit('close');
    }
}
</script>

<style lang="less" scoped>
#localeSelector {
    // width: 340px;
    width: 12rem;
    height: 276px;
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    background: #FAFAFA;
    box-shadow: 8px 12px 36px 0px rgba(0, 0, 0, 0.10);
    display: none;
    position: absolute;
    z-index: 2;
    margin-top: 4px;

    &.show {
        display: block;
    }

    .wrap {
        height: 100%;
        overflow: scroll;
    }

    .country {
        display: flex;
        gap: 16px;
        margin: 5px;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;

        &.selected {
            background-color: rgba(41, 63, 230, 0.05);
            border: 1px solid var(--main-color);
        }

        &:hover {
            background-color: rgba(41, 63, 230, 0.05);
        }
        
        .name {
            flex: 0.95;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
    }
}
</style>