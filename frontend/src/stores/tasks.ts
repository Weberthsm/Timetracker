import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tasksService, type Task, type TaskStatus } from '@/services/tasks.service'

export const useTasksStore = defineStore('tasks', () => {
  const tasksByProject = ref<Record<string, Task[]>>({})

  async function fetchByProject(projectId: string) {
    const res = await tasksService.list(projectId, { limit: '500' })
    const body = (res.data as { data: { data: Task[] } }).data
    tasksByProject.value[projectId] = body.data
  }

  async function create(projectId: string, data: { title: string; description?: string }) {
    const res = await tasksService.create(projectId, data)
    const task = (res.data as { data: Task }).data
    if (!tasksByProject.value[projectId]) tasksByProject.value[projectId] = []
    tasksByProject.value[projectId].unshift(task)
    return task
  }

  async function update(projectId: string, id: string, data: Partial<{ title: string; description: string; status: TaskStatus }>) {
    const res = await tasksService.update(projectId, id, data)
    const updated = (res.data as { data: Task }).data
    const tasks = tasksByProject.value[projectId]
    if (tasks) {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx !== -1) tasks[idx] = updated
    }
    return updated
  }

  async function remove(projectId: string, id: string) {
    await tasksService.delete(projectId, id)
    tasksByProject.value[projectId] = (tasksByProject.value[projectId] ?? []).filter((t) => t.id !== id)
  }

  return { tasksByProject, fetchByProject, create, update, remove }
})
