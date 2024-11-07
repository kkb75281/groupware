<template lang="pug">
Header
Navbar
main#main
    router-view
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
#main {
    padding-top: calc(var(--header-height));
    padding-left: calc(var(--navbar-width));
    transition: padding-left 0.15s linear;

    .wrap {
        padding: 40px 20px 0;
    }
}

.fold {
    #navbar {
        width: var(--navbar-fold-width);
    }

    #main {
        padding-left: calc(var(--navbar-fold-width));

        .wrap {
            padding: 40px 20px 0;
        }
    }

    #header {
        padding-left: var(--navbar-fold-width);
    }
}

@media (max-width: 1200px) {
    #header {
        padding: 0 16px;
    }

    #navbar {
        left: calc(-1 * var(--navbar-width));
    }

    #main {
        padding-left: 0;

        .wrap {
            padding: 40px 16px;
        }
    }

    .fold {
        #header {
            padding: 0 16px;
        }

        #navbar {
            left: calc(-1 * var(--navbar-width));
        }

        #main {
            padding-left: 0;
        }
    }
}
</style>