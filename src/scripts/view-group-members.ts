import { db } from '../lib/database'

async function viewGroupMembers() {
  try {
    console.log('📊 Group Members Table Records:')
    console.log('=' .repeat(80))
    
    const members = await db
      .selectFrom('group_members')
      .leftJoin('users', 'group_members.user_id', 'users.id')
      .leftJoin('groups', 'group_members.group_id', 'groups.id')
      .leftJoin('user_group_roles', (join) =>
        join
          .onRef('user_group_roles.user_id', '=', 'group_members.user_id')
          .onRef('user_group_roles.group_id', '=', 'group_members.group_id')
      )
      .leftJoin('group_roles', 'user_group_roles.role_id', 'group_roles.id')
      .select([
        'group_members.id as member_id',
        'group_members.user_id',
        'group_members.group_id',
        'group_members.joined_at',
        'group_members.need_admin_approve',
        'group_members.created_at',
        'group_members.updated_at',
        'users.email as user_email',
        'users.name as user_name',
        'users.is_admin as user_is_admin',
        'groups.name as group_name',
        'group_roles.name as role_name'
      ])
      .orderBy('group_members.created_at', 'desc')
      .execute()

    if (members.length === 0) {
      console.log('❌ No group members found.')
      return
    }

    console.log(`Found ${members.length} group member records:\n`)

    members.forEach((member, index) => {
      console.log(`📋 Member #${index + 1}:`)
      console.log(`   ID: ${member.member_id}`)
      console.log(`   User: ${member.user_name || 'No name'} (${member.user_email})`)
      console.log(`   Group: ${member.group_name} (ID: ${member.group_id})`)
      console.log(`   Role: ${member.role_name || 'No role'}`)
      console.log(`   Joined: ${member.joined_at}`)
      console.log(`   Needs Admin Approval: ${member.need_admin_approve ? '🔴 YES' : '🟢 NO'}`)
      console.log(`   User is Admin: ${member.user_is_admin ? '👑 YES' : '👤 NO'}`)
      console.log(`   Created: ${member.created_at}`)
      console.log(`   Updated: ${member.updated_at}`)
      console.log('   ' + '-'.repeat(60))
    })

    // Summary statistics
    const needsApproval = members.filter(m => m.need_admin_approve).length
    const approved = members.filter(m => !m.need_admin_approve).length
    const admins = members.filter(m => m.user_is_admin).length
    const withRoles = members.filter(m => m.role_name).length

    console.log('\n📈 Summary Statistics:')
    console.log(`   Total Members: ${members.length}`)
    console.log(`   🔴 Need Admin Approval: ${needsApproval}`)
    console.log(`   🟢 Approved Members: ${approved}`)
    console.log(`   👑 Admin Users: ${admins}`)
    console.log(`   🎭 Members with Roles: ${withRoles}`)

    // Group by group
    const byGroup = members.reduce((acc, member) => {
      const groupName = member.group_name
      if (!acc[groupName]) {
        acc[groupName] = []
      }
      acc[groupName].push(member)
      return acc
    }, {} as Record<string, typeof members>)

    console.log('\n📊 Members by Group:')
    Object.entries(byGroup).forEach(([groupName, groupMembers]) => {
      const pending = groupMembers.filter(m => m.need_admin_approve).length
      const approved = groupMembers.filter(m => !m.need_admin_approve).length
      console.log(`   ${groupName}: ${groupMembers.length} members (${approved} approved, ${pending} pending)`)
    })

  } catch (error) {
    console.error('❌ Error fetching group members:', error)
  } finally {
    process.exit(0)
  }
}

viewGroupMembers()
