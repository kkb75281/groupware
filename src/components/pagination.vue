<template lang="pug">
.pagination
    button.btn-prev.icon(
        type="button"
        @click="goPrev"
        :class="{ nonClickable: fetching || currentPage <= 1 }"
    )
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
        | Prev

    button.btn-next.icon(
        type="button"
        @click="goNext"
        :class="{ nonClickable: fetching || (endOfList && currentPage >= maxPage) }"
    )
        | Next
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

defineProps({
    fetchFunction: Function,
    ascending: Boolean
});

const emit = defineEmits(['update:pageData']);

const fetching = ref(false);
const maxPage = ref(0);
const currentPage = ref(1);
const endOfList = ref(false);
let pager = null;

const getPage = async (refresh = false) => {
    if (refresh) {
        endOfList.value = false;
        currentPage.value = 1;
    }

    if (refresh) {
        pager = await Pager.init({
            id: 'record_id',
            resultsPerPage: 10,
            sortBy: 'uploaded',
            order: ascending ? 'asc' : 'desc'
        });
    }

    if ((!refresh && maxPage.value >= currentPage.value) || endOfList.value) {
        emit('update:pageData', pager.getPage(currentPage.value).list);
        return;
    } else if (!endOfList.value || refresh) {
        fetching.value = true;

        try {
            const fetchedData = await fetchFunction({
                fetchMore: !refresh,
                limit: 10,
                ascending
            });

            endOfList.value = fetchedData.endOfList;

            if (fetchedData.list.length > 0) {
                await pager.insertItems(fetchedData.list);
            }

            const disp = pager.getPage(currentPage.value);
            maxPage.value = disp.maxPage;

            emit('update:pageData', disp.list);
        } catch (error) {
            console.error('Error getting page:', error);
            emit('update:pageData', []);
        } finally {
            fetching.value = false;
        }
    }
};

watch(currentPage, (n, o) => {
    if (n !== o && n > 0 && (n <= maxPage.value || (n > maxPage.value && !endOfList.value))) {
        getPage();
    } else {
        currentPage.value = o;
    }
});

const goPrev = () => currentPage.value--;
const goNext = () => currentPage.value++;
onMounted(() => getPage(true));
</script>
