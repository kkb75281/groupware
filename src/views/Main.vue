<template lang="pug">
Header
Navbar
main#main
    .wrap
        router-view
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';
import { mailList, updateEmails, readAudit, readList, readNoti, newsletterList, getNewsletterList } from "@/notifications";

const router = useRouter();
const route = useRoute();

let emailCheckInterval;

onMounted(async () => {
    await updateEmails();
    
    // 30초마다 이메일 업데이트
    emailCheckInterval = setInterval(() => {
        updateEmails();
    }, 10000);
});
</script>

<style scoped lang="less">
#main {
    padding-top: calc(var(--header-height));
    padding-left: calc(var(--navbar-width));
    transition: padding-left 0.15s linear;

    .wrap {
        // padding: 3rem 2.4rem 0;
        padding: 3rem 2.4rem;
    }
}

.fold {
    #navbar {
        width: var(--navbar-fold-width);
    }

    #main {
        padding-left: calc(var(--navbar-fold-width));

        .wrap {
            padding: 3rem 2.4rem 0;
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
    }
}

@media (max-width: 768px) {
    #header {
        padding: 0 16px;
    }

    #main {
        padding-left: 0;

        .wrap {
            padding-left: 16px;
            padding-right: 16px;
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