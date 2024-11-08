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
        // padding: 40px 20px 0;
        padding: 7rem 2.4rem 0;
    }
}

.fold {
    #navbar {
        width: var(--navbar-fold-width);
    }

    #main {
        padding-left: calc(var(--navbar-fold-width));

        .wrap {
            padding: 7rem 2.4rem 0;
        }
    }

    #header {
        padding-left: var(--navbar-fold-width);
    }
}

@media (max-width: 1200px) {
    #header {
        padding-left: 2.4rem;
    }

    #navbar {
        left: calc(-1 * var(--navbar-width));
    }

    #main {
        padding-left: 0;

        .wrap {
            padding-top: 3rem;
        }
    }
}

@media (max-width: 768px) {
    #header {
        padding: 0 16px;
    }

    #main {
        padding-left: 0;

        .wrap {
            padding: 3rem 16px;
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