# Fa Hui Cu Access Control Matrix

Role efektif:

- `Member`: anggota biasa.
- `Trainer`: trainer/speaker/pengajar yang perlu akses terbatas ke feedback atau materi terkait.
- `Ketua`: ketua/sub-ketua untuk pengawasan operasional.
- `Admin`: pengelola penuh database dan approval.

| Action | Member | Trainer | Ketua | Admin |
| --- | --- | --- | --- | --- |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ |
| View events | ✅ | ✅ | ✅ | ✅ |
| Register event | ✅ | ✅ | ✅ | ✅ |
| Create event | ❌ | ❌ | ✅ | ✅ |
| Edit event | ❌ | ❌ | ✅ | ✅ |
| Approve user | ❌ | ❌ | ❌ | ✅ |
| View feedback summary | ❌ | partial | ✅ | ✅ |
| View all members | ❌ | ❌ | partial | ✅ |

Catatan `partial`:

- Trainer hanya boleh melihat feedback summary untuk acara/sesi tempat dia menjadi trainer/speaker.
- Ketua hanya boleh melihat anggota sesuai scope divisi/kelas/acara yang menjadi tanggung jawabnya, bukan seluruh database.
- Admin dapat melihat dan mengubah seluruh data.
