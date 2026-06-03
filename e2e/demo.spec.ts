import { test, expect } from '@playwright/test'

test.describe('Pulse — parcours de démonstration', () => {
  test('connexion démo en 1 clic → dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /connexion démo/i }).click()
    await expect(page).toHaveURL(/\/app\//)
    await expect(page.getByRole('heading', { name: 'Moniteurs' })).toBeVisible()
    await expect(page.getByText('API publique')).toBeVisible()
  })

  test('ouverture du détail d’un moniteur', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /connexion démo/i }).click()
    await expect(page.getByRole('heading', { name: 'Moniteurs' })).toBeVisible()
    await page.getByText('API publique').click()
    await expect(page.getByText('90 derniers jours')).toBeVisible()
  })

  test('page de statut publique accessible sans authentification', async ({ page }) => {
    await page.goto('/status/acme')
    await expect(page.getByRole('heading', { name: 'Acme Inc.' })).toBeVisible()
    await expect(page.getByText('Tunnel de paiement', { exact: true })).toBeVisible()
    await expect(page.getByText('Historique des incidents')).toBeVisible()
  })
})
