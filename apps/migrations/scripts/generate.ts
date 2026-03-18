import { mkdir, writeFile } from 'node:fs/promises'

async function main() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  const hour = now.getHours()
  const minute = now.getMinutes()
  const second = now.getSeconds()
  const ds = Math.round(now.getMilliseconds() / 100)
  const digest = ((hour * 60 + minute) * 60 + second) * 10 + ds

  const migrationName = process.argv[2] || 'new_migration'

  const path = `sql/${year}-${month}-${day}-${digest}_${migrationName}`

  await mkdir(path)

  await Promise.all([
    writeFile(
      `${path}/up.sql`,
      `-- Migration generated on ${year}-${month}-${day} ${hour}:${minute}:${second}\n\n-- Write your SQL migration here\n`
    ),
    writeFile(
      `${path}/down.sql`,
      `-- Migration generated on ${year}-${month}-${day} ${hour}:${minute}:${second}\n\n-- Write your SQL rollback here\n`
    ),
  ])

  console.info(`Migration files created:`)
  console.info(`${path}/up.sql: Write the SQL statements to apply the migration.`)
  console.info(`${path}/down.sql: Write the SQL statements to rollback the migration.`)
}

main()
