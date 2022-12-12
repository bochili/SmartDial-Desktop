<template>
    <div class="container">
        <a-modal width="600px" @ok="handleSavePolicyList" v-model:visible="manageDialogVisible">
            <template #title>
                管理策略方案
            </template>
            <div>
                <a-table row-key="title" :row-selection="{ type: 'checkbox', showCheckedAll: true }" :pagination="{
                    pageSize: 7
                }" v-model:selectedKeys="selectedPolicies" :columns="managePolicyColumns" :data="policyList">
                    <template #title="{ record, rowIndex }">
                        <a-input v-model="record.title" />
                    </template><template #path="{ record, rowIndex }">
                        <a-input v-model="record.path" />
                    </template>
                </a-table>
                <div class="table-operate">
                    <a-button @click="handleAddPolicy" type="secondary" status="info">添加方案</a-button>
                    <a-button class="ml-10" @click="handleDeletePolicy" type="secondary" status="danger">删除所选</a-button>
                </div>
            </div>
        </a-modal>
        <a-modal v-model:visible="addSchemeDialogVisible" @ok="handleAdd" ok-text="添加">
            <template #title>
                添加新方案
            </template>
            <div>
                <a-input v-model="addPlanTitle" placeholder="请输入标题" />

            </div>
        </a-modal>
        <a-modal width="630px" v-model:visible="addPlanDialogVisible" @ok="handleAddPlan" ok-text="添加">
            <template #title>
                添加触发方式
            </template>
            <div>
                <a-radio-group v-model="selectedOperateOptions" :options="operateOptions" />
            </div>
        </a-modal>
        <div>
            <header>
                <div class="header-title">策略配置</div>
                <div class="header-operate">
                    <div>
                        <a-select @change="handleSelectPolicy"
                            :model-value="store.getLocalConfig.keyPolicyList[store.getLocalConfig.keyPolicySelected].title"
                            :style="{ width: '200px' }" placeholder="尚未配置">
                            <a-option v-for="(item, index) of policyList">{{ item.title }}</a-option>
                        </a-select>
                        <a-button class="ml-10" type="primary" @click="(manageDialogVisible = true)">
                            管理
                        </a-button>
                    </div>
                    <div>
                        <span>当前激活方案：</span>
                        <a-select @change="handleSelectScheme" v-if="currentPolicy[currentScheme]"
                            :model-value="currentPolicy[usingScheme].name" :style="{ width: '200px' }"
                            placeholder="尚未配置">
                            <a-option v-for="(item, index) of currentPolicy">{{ item.name }}</a-option>
                        </a-select>
                    </div>
                </div>
            </header>
            <div>

                <a-tabs @change="handleSchemeChanged" type="line" position="top" :editable="true" @add="
                addSchemeDialogVisible = true" @delete="handleDelete" show-add-button auto-switch>
                    <a-tab-pane v-for="(item, index) of currentPolicy" :key="index" :title="item.name">
                        <a-tabs type="line" position="top" :editable="true" @add="(addPlanDialogVisible = true)"
                            @delete="handleDeletePlan" show-add-button auto-switch>
                            <a-tab-pane v-for="(value, index1) in item.keyPolicy" :key="index1" :title="value.name">
                                <div class="mb-10" v-if="value.name == '长按'">
                                    <span>按下时长：</span>
                                    <a-input style="width:200px" placeholder="按下时长" v-model="value.policy.timeout" />
                                </div>
                                <a-table :data="value.policy">
                                    <template #columns>
                                        <!-- <a-table-column title="名称">
                                            <template #cell="{ record, rowIndex }">
                                                <a-input placeholder="请输入名称" v-model="value.policy[rowIndex].name" />
                                            </template>
                                        </a-table-column> -->
                                        <a-table-column title="类型">
                                            <template #cell="{ record, rowIndex }">
                                                <a-select v-model="value.policy[rowIndex].type"
                                                    @change="(e) => handlePlanTypeChange(item.name, value.name, rowIndex, e)">
                                                    <a-option v-for="(typeOption) of planTypeOptions">{{ typeOption
                                                    }}</a-option>
                                                </a-select>
                                            </template>
                                        </a-table-column>
                                        <!-- <a-table-column v-if="value.name == '长按'" title="按下时长">
                                            <template #cell="{ record, rowIndex }">
                                                <a-input placeholder="按下时长" v-model="value.policy[rowIndex].timeout" />
                                            </template>
                                        </a-table-column> -->
                                        <a-table-column title="动作">
                                            <template #cell="{ record, rowIndex }">
                                                <a-select v-if="value.policy[rowIndex].type == '内置方法'"
                                                    v-model="value.policy[rowIndex].function"
                                                    @change="(e) => handlePlanActionChange(item.name, value.name, rowIndex, e)">
                                                    <a-option v-for="(internalOption) of internalFunctionOptions">{{
                                                            internalOption
                                                    }}</a-option>
                                                </a-select>
                                                <a-button
                                                    v-else-if="value.policy[rowIndex].type == '自定义组合'">编辑动作</a-button>
                                                <a-select v-else-if="value.policy[rowIndex].type == '自定义方法'"
                                                    v-model="value.policy[rowIndex].function"
                                                    @change="() => handlePlanActionChange(item.name, value.name, rowIndex)">
                                                    <a-option v-for="(customOption) of customFunctionOptions">{{
                                                            customOption
                                                    }}</a-option>
                                                </a-select>
                                            </template>
                                        </a-table-column>
                                        <a-table-column title="操作">
                                            <template #cell="{ record, rowIndex }">
                                                <a-button type="primary" status="danger" size="mini"
                                                    @click="handleRowDelete(index, index1, rowIndex)">
                                                    <template #icon><icon-delete /></template>
                                                </a-button>
                                            </template>
                                        </a-table-column>
                                    </template>
                                </a-table>
                                <div class="table-operate">
                                    <a-button @click="handleTableAdd(index1)" class="mr-10" type="secondary"
                                        status="success">添加动作</a-button>
                                    <a-button class="mr-10" @click="resetPolicy" type="secondary"
                                        status="danger">复位</a-button>
                                    <a-button @click="savePolicy" type="primary" status="info">保存</a-button>
                                </div>
                            </a-tab-pane>
                        </a-tabs>
                    </a-tab-pane>
                </a-tabs>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue'
import { DevicesStore } from "@/store/index"
import { Message } from '@arco-design/web-vue';
const { ipcRenderer, remote } = window.electron
const store = DevicesStore()
let policyList = ref([])
let selectedPolicy = ref(0)
let currentPolicy = ref([])
let manageDialogVisible = ref(false)
let addSchemeDialogVisible = ref(false)
let addPlanDialogVisible = ref(false)
let addPlanTitle = ref('')
let planTypeOptions = ref(['内置方法', '逻辑操作', '自定义组合', '自定义方法'])
let operateOptions = ref(['单击', '长按', '顺时针', '逆时针', '按下顺时针', '按下逆时针', '触发长按后顺时针', '触发长按后逆时针', '触发长按后单击', '触发长按后松开'])
let internalFunctionOptions = ref(['toggleWindow', 'togglePlay', 'openWindowMenu', 'windowMenuLeft', 'left', 'right', 'enter', 'nextSong', 'prevSong', 'backspace'])
let customFunctionOptions = ref([])
let currentScheme = ref(0)
let policyBackup = ref([])
let selectedPolicies = ref([])
let selectedOperateOptions = ref('')
let usingScheme = ref(0)
const managePolicyColumns = [
    {
        title: "名称",
        dataIndex: 'title',
        slotName: "title"
    },
    {
        title: "路径",
        dataIndex: "path",
        slotName: "path"
    }
]
onMounted(() => {
    policyList.value = store.getLocalConfig.keyPolicyList
    selectedPolicy.value = store.getLocalConfig.keyPolicySelected
    ipcRenderer.send("getPolicyContent")
    // console.log(store.getLocalConfig.keyPolicyList[keyPolicySelected]);
})
ipcRenderer.on("schemeChanged", (e, data) => {
    usingScheme.value = data
})
ipcRenderer.on("policyContent", (e, data) => {
    console.log("policyContent", data);
    currentPolicy.value = data
    policyBackup.value = data
})
ipcRenderer.on("keyPolicySaved", () => {
    Message.success("按键方案保存成功！")
})
ipcRenderer.on('selectedFile', function (e, files) {
    policyList.value.push({ title: `新配置${policyList.value.length}`, path: files[0] })
});
const handleSavePolicyList = () => {
    ipcRenderer.send("savePolicyList", JSON.parse(JSON.stringify(policyList.value)))
}
const handleSchemeChanged = (e) => {
    console.log(e);
    currentScheme.value = e
}
const handleSelectScheme = (e) => {
    console.log(e);
    ipcRenderer.send("changeScheme", currentPolicy.value.findIndex(el => el.name == e))
}
const handleAddPolicy = () => {
    ipcRenderer.send('openSelectFile', {
        properties: ['openFile'],
        title: "请选择按键方案文件",
        buttonLabel: "打开",
        filters: [
            { name: 'json', extensions: ['json'] }
        ]
    });
}
const handleSelectPolicy = (e) => {
    console.log(e);
    selectedPolicy.value
}
const handleAdd = () => {
    addSchemeDialogVisible.value = false
    currentPolicy.value.push({
        name: addPlanTitle.value,
        order: currentPolicy.value.length,
        keyPolicy: [
            {
                name: "单击",
                "policy": [
                    {
                        "type": "内置方法",
                        "function": "toggleWindow"
                    }
                ]
            }
        ]
    })
    addPlanTitle.value = ''
}
const handleDelete = (e) => {
    console.log(e)
    currentPolicy.value.splice(e, 1)
}
const handleAddPlan = () => {
    addPlanDialogVisible.value = false
    console.log(selectedOperateOptions.value);
    console.log(currentPolicy.value[currentScheme.value].keyPolicy);
    currentPolicy.value[currentScheme.value].keyPolicy.push({
        name: selectedOperateOptions.value,
        policy: [
            {
                'type': "内置方法",
                'function': ""
            }
        ]
    })
}
const handleDeletePolicy = () => {
    console.log(selectedPolicies.value);
    for (let item of selectedPolicies.value) {
        policyList.value.splice(policyList.value.findIndex(el => el.title == item), 1);
    }
}
const handleDeletePlan = (e) => {
    console.log(currentScheme.value);
    console.log(e)
    console.log(currentPolicy.value[currentScheme.value].keyPolicy.splice(e, 1));
}
const savePolicy = () => {
    console.log(currentPolicy.value);
    console.log(policyList.value[selectedPolicy.value].path);
    let sendContent = JSON.parse(JSON.stringify({ policy: currentPolicy.value, path: policyList.value[selectedPolicy.value].path }))
    ipcRenderer.send("savePolicy", sendContent);
}
const resetPolicy = () => {
    currentPolicy.value = JSON.parse(JSON.stringify(policyBackup.value))
    console.log(currentPolicy.value);
}
const handlePlanTypeChange = (policy, schema, rowIndex, e) => {
    console.log(policy + ',' + schema + ',' + rowIndex + ',' + e);
}
const handlePlanActionChange = (policy, schema, rowIndex, e) => {
    console.log(policy + ',' + schema + ',' + rowIndex + ',' + e);
}
const handleTableAdd = (e) => {
    console.log(currentPolicy.value[currentScheme.value].keyPolicy[e]);
    currentPolicy.value[currentScheme.value].keyPolicy[e].policy.push({
        "type": "",
    })
}
const handleRowDelete = (schema, operation, rowIndex) => {
    console.log(schema + ',' + operation + ',' + rowIndex);
    currentPolicy.value[currentScheme.value].keyPolicy[operation].policy.splice(rowIndex, 1)
    console.log(currentPolicy.value[currentScheme.value].keyPolicy[operation].policy);
    Message.success("删除成功！")
}
</script>
<style scoped>

</style>