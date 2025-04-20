interface TermsOfService {
  name: string;
  version: string;
  lastModified: string;
  content: string;
  accepted: boolean;
}

export async function retrieveLatestTerms(): Promise<TermsOfService> {
  try {
    const response = await fetch('https://chromepolicy.googleapis.com/v1/terms/latest', {
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch terms of service');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
}

export async function acceptTerms(version: string): Promise<void> {
  try {
    const response = await fetch('https://chromepolicy.googleapis.com/v1/terms/accept', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        accepted: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to accept terms of service');
    }
  } catch (error) {
    console.error('Error accepting terms:', error);
    throw error;
  }
}