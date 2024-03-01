# cryptotools.dev

Simple tools for secure random generation, transformation, and crypto operations in the browser.

## Develop

```
docker compose up
```

https://localhost:8433

## Software Bill of Materials (SBOM)

The following is a list of all third-party runtime dependencies.

| Package       | Version | Purpose                                                | License      | Project archived? | Possibly abandonware? | Last update  | Risk |
| ------------- | ------- | ------------------------------------------------------ | ------------ | ----------------- | --------------------- | ------------ | ---- |
| [asn1js][1]   | ^3.0.5  | EC and RSA key structure validation during key imports | BSD-3-Clause | No                | No                    | 2 months ago | Low  |
| [bcryptjs][2] | ^2.4.3  | Bcrypt password hashing                                | MIT          | No                | Yes                   | 4 years ago  | High |
| [tssrp6a][3]  | ^3.0.0  | Secure Remote Password Emulation                       | Apache-2.0   | No                | Yes                   | 3 years ago  | High |

SBOM last updated 1 March 2024.

[1]: https://github.com/PeculiarVentures/ASN1.js
[2]: https://github.com/dcodeIO/bcrypt.js
[3]: https://github.com/midonet/tssrp6a
