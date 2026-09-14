export const SAMPLE = {
  company: 'Northshore Engineering Ltd',
  person: 'Gavin Scott',
  divert: '07700 900123',
  portNumbers: '0141 111 1111 - Main number\n0141 222 2222 - Jane Smith',
  portalUser: 'Jane Smith',
}

/** Choose an option inside a named group, scoped to a container when given. */
export async function choose(scope, groupName, optionLabel) {
  await scope
    .getByRole('group', { name: groupName })
    .getByRole('radio', { name: optionLabel, exact: true })
    .check()
}

export async function fillAboutStep(page) {
  await page.getByLabel('Company name').fill(SAMPLE.company)
  await page.getByLabel('Your full name').fill(SAMPLE.person)
  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillTeamStep(page) {
  const defaults = page.locator('.panel--defaults')
  await choose(defaults, /^Voicemail/, 'Yes')
  await choose(defaults, /^Send voicemail to email/, 'Yes')
  await choose(defaults, /^Number shown on outgoing calls/, 'Main office number')
  await choose(defaults, /^Desk phone/, 'Corded desk phone')
  await choose(defaults, /^Mobile app/, 'iPhone (iOS)')
  await choose(defaults, /^Desktop app/, 'No')

  await page.getByText('Add several people at once').click()
  await page
    .getByLabel('Paste your staff list')
    .fill('Jane Smith, jane@northshore.co.uk\nRoss Kerr, ross@northshore.co.uk')
  await page.getByRole('button', { name: 'Add these people' }).click()

  // The blank starter row is not needed once real people have been pasted in.
  await page.locator('.person').first().getByRole('button', { name: /^Remove/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillCallsStep(page) {
  await page.getByLabel('Emergency divert number').fill(SAMPLE.divert)
  await page.getByLabel('Numbers moving to the new system').fill(SAMPLE.portNumbers)
  await choose(page, /^Do you need an auto attendant\?/, 'No')
  await choose(page, /^Do you want a company voicemail box\?/, 'No')
  await choose(page, /^Do the lines close at lunchtime/, 'No')
  await choose(page, /^Do you want music or a message/, 'No')
  await page.getByLabel('Nominated portal user').fill(SAMPLE.portalUser)
  await choose(page, /^Do you need call pick-up groups\?/, 'No')
  await choose(page, /^Should everyone show the main number/, 'Yes, everyone shows the main number')
  await page.getByRole('button', { name: 'Continue' }).click()
}
